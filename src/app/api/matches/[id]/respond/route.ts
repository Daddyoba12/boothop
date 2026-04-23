import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { sendMatchAcceptedEmail, sendMatchDeclinedEmail } from '@/lib/email/sendMatchEmail';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { action } = await request.json();
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'action must be accept or decline.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email = session.email.toLowerCase().trim();

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, offered_price, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date), traveler_trip:traveler_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.status !== 'matched') {
      return NextResponse.json({ error: 'This match is no longer pending.' }, { status: 400 });
    }

    // Only the listing owner (the person who did NOT initiate interest) can respond
    const senderEmail   = match.sender_email?.toLowerCase().trim();
    const travelerEmail = match.traveler_email?.toLowerCase().trim();
    const isInvolved    = email === senderEmail || email === travelerEmail;
    if (!isInvolved) {
      return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
    }

    // Derive the other party (Mr B — who expressed interest)
    const otherEmail = email === senderEmail ? travelerEmail : senderEmail;

    // Get route info — prefer sender_trip, fall back to traveler_trip
    const senderTrip   = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
    const travelerTrip = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
    const tripInfo     = senderTrip ?? travelerTrip;
    const fromCity     = tripInfo?.from_city  ?? '';
    const toCity       = tripInfo?.to_city    ?? '';
    const travelDate   = tripInfo?.travel_date ?? '';
    const price        = match.agreed_price ?? match.offered_price ?? 0;
    const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

    if (action === 'accept') {
      // Move match to agreed — both sides have committed
      await supabase
        .from('matches')
        .update({ status: 'agreed', agreed_price: price, sender_accepted: true, traveler_accepted: true })
        .eq('id', matchId);

      // Create magic login token for Mr B so they land on their dashboard
      if (otherEmail) {
        const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const { data: tokenData } = await supabase
          .from('action_tokens')
          .insert({ email: otherEmail, action_type: 'magic_login', entity_id: matchId, payload: { redirectTo: '/dashboard' }, expires_at })
          .select('token').single();

        sendMatchAcceptedEmail({
          toEmail:    otherEmail,
          fromCity,
          toCity,
          travelDate,
          price,
          loginToken: tokenData?.token,
          appUrl,
        }).catch(e => console.error('sendMatchAcceptedEmail failed', e));
      }

      return NextResponse.json({ ok: true, status: 'agreed' });
    }

    if (action === 'decline') {
      await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', matchId);

      // Delete any auto-created mirror trips tied to this match
      const mirrorTripId = email === senderEmail ? match.traveler_trip_id : match.sender_trip_id;
      if (mirrorTripId) {
        await supabase.from('trips').delete().eq('id', mirrorTripId).eq('auto_created', true);
      }

      if (otherEmail) {
        sendMatchDeclinedEmail({
          toEmail:    otherEmail,
          fromCity,
          toCity,
          travelDate,
        }).catch(e => console.error('sendMatchDeclinedEmail failed', e));
      }

      return NextResponse.json({ ok: true, status: 'declined' });
    }

  } catch (error) {
    console.error('matches/respond error', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
