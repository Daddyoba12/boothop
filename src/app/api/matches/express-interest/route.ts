import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/auth/code';
import { sendInterestEmail } from '@/lib/email/sendMatchEmail';
import { getAppSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    // Require a valid session — unauthenticated interest expressions are not allowed
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to express interest.' }, { status: 401 });
    }

    const body         = await request.json();
    const tripId       = String(body?.tripId || '').trim();
    const interestType = body?.interestType === 'offer' ? 'offer' : 'full_price';
    const discountPct  = interestType === 'offer' ? Number(body?.discountPct ?? 0) : 0;
    const offeredPrice = body?.offeredPrice != null ? Number(body.offeredPrice) : null;

    // Always use the authenticated session email — never trust the body email
    const email = normalizeEmail(session.email);

    if (!tripId) return NextResponse.json({ error: 'tripId is required.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    // Fetch the trip being expressed interest in
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, email, from_city, to_city, travel_date, price, type')
      .eq('id', tripId)
      .maybeSingle();

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
    }

    // Prevent self-interest — you can't be both Booter and Hooper on the same trip
    if (trip.email && normalizeEmail(trip.email) === email) {
      return NextResponse.json(
        { error: 'You cannot be both a Booter and a Hooper on the same trip. This is your own listing.' },
        { status: 400 },
      );
    }

    const finalOfferedPrice = offeredPrice ?? trip.price ?? 0;

    // Derive both sides and ensure they are different people
    const senderEmail   = trip.type === 'travel' ? email           : (trip.email ?? null);
    const travelerEmail = trip.type === 'travel' ? (trip.email ?? null) : email;

    if (senderEmail && travelerEmail && normalizeEmail(senderEmail) === normalizeEmail(travelerEmail)) {
      return NextResponse.json(
        { error: 'The sender and traveller cannot be the same person.' },
        { status: 400 },
      );
    }

    // Auto-create a mirror trip for the expressing party so both sides always have a trip ID.
    // If the listed trip is 'travel' → the expressing party is the sender → auto-create a 'send' trip.
    // If the listed trip is 'send'   → the expressing party is the traveler → auto-create a 'travel' trip.
    const mirrorType = trip.type === 'travel' ? 'send' : 'travel';
    const { data: mirrorTrip, error: mirrorErr } = await supabase
      .from('trips')
      .insert({
        email:        email,
        type:         mirrorType,
        from_city:    trip.from_city,
        to_city:      trip.to_city,
        travel_date:  trip.travel_date,
        price:        finalOfferedPrice,
        weight:       null,
        status:       'matched',
        auto_created: true,
      })
      .select('id')
      .single();

    if (mirrorErr || !mirrorTrip) {
      console.error('mirror trip insert error', mirrorErr);
      return NextResponse.json({ error: 'Could not create your trip record.' }, { status: 500 });
    }

    const sender_trip_id   = trip.type === 'send'   ? tripId : mirrorTrip.id;
    const traveler_trip_id = trip.type === 'travel' ? tripId : mirrorTrip.id;

    // Block duplicate interest from the same email on the same trip
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('trip_id', tripId)
      .or(`sender_email.eq.${email},traveler_email.eq.${email}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already expressed interest in this trip.' }, { status: 409 });
    }

    // Insert match and get back the generated ID
    const { data: newMatch, error: matchErr } = await supabase.from('matches').insert({
      trip_id:          tripId,
      sender_trip_id,
      traveler_trip_id,
      sender_email:     senderEmail,
      traveler_email:   travelerEmail,
      offered_price:    finalOfferedPrice,
      interest_type:    interestType,
      status:           'matched',
    }).select('id').single();

    if (matchErr || !newMatch) {
      console.error('match insert error', matchErr);
      return NextResponse.json({ error: `Could not save interest: ${matchErr?.message}` }, { status: 500 });
    }

    const matchId = newMatch.id;

    // Create a magic login token for the trip owner so clicking email logs them in and goes to dashboard
    if (trip.email) {
      const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const { data: tokenData } = await supabase.from('action_tokens').insert({
        email: trip.email, action_type: 'magic_login', entity_id: matchId,
        payload: { redirectTo: '/dashboard' }, expires_at,
      }).select('token').single();

      sendInterestEmail({
        toEmail:      trip.email,
        fromEmail:    email,
        fromCity:     trip.from_city,
        toCity:       trip.to_city,
        travelDate:   trip.travel_date || '',
        offeredPrice: finalOfferedPrice,
        listingPrice: trip.price ?? finalOfferedPrice,
        interestType,
        matchId,
        loginToken:   tokenData?.token,
      })
        .then(() => console.log(`sendInterestEmail sent to ${trip.email} for match ${matchId}`))
        .catch((e) => console.error(`sendInterestEmail failed for match ${matchId} to ${trip.email}:`, e));
    } else {
      console.error(`express-interest: trip ${tripId} has no email — notification skipped for match ${matchId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('express-interest error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 },
    );
  }
}
