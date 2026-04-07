import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/auth/code';
import { sendInterestEmail } from '@/lib/email/sendMatchEmail';

export async function POST(request: Request) {
  try {
    const body         = await request.json();
    const tripId       = String(body?.tripId || '').trim();
    const interestType = body?.interestType === 'offer' ? 'offer' : 'full_price';
    const discountPct  = interestType === 'offer' ? Number(body?.discountPct ?? 0) : 0;
    const offeredPrice = body?.offeredPrice != null ? Number(body.offeredPrice) : null;
    const email        = normalizeEmail(body?.email || '');

    if (!tripId)            return NextResponse.json({ error: 'tripId is required.' }, { status: 400 });
    if (!email.includes('@')) return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });

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

    // Assign trip ID to the correct side based on trip type
    // If the listed trip is a 'travel' trip → it's the traveler's trip
    // If the listed trip is a 'send' trip   → it's the sender's trip
    const sender_trip_id   = trip.type === 'send'   ? tripId : null;
    const traveler_trip_id = trip.type === 'travel' ? tripId : null;

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

    // Upsert interest record into matches table
    const { error: matchErr } = await supabase.from('matches').insert({
      trip_id:          tripId,
      sender_trip_id,
      traveler_trip_id,
      sender_email:     senderEmail,
      traveler_email:   travelerEmail,
      offered_price:    finalOfferedPrice,
      interest_type:    interestType,
      status:           'pending',
    });

    if (matchErr) {
      console.error('match insert error', matchErr);
      return NextResponse.json({ error: `Could not save interest: ${matchErr.message}` }, { status: 500 });
    }

    // Fire email to trip owner (best-effort)
    if (trip.email) {
      sendInterestEmail({
        toEmail:      trip.email,
        fromEmail:    email,
        fromCity:     trip.from_city,
        toCity:       trip.to_city,
        travelDate:   trip.travel_date || '',
        offeredPrice: finalOfferedPrice,
        listingPrice: trip.price ?? finalOfferedPrice,
        interestType,
        matchId:      tripId,
      }).catch((e) => console.error('sendInterestEmail failed', e));
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
