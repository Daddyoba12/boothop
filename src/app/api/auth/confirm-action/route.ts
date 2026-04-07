import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { signAppSession, getSessionCookieName } from '@/lib/auth/session';
import { sendTermsAcceptanceEmail } from '@/lib/email/sendTermsEmail';
import { sendAdminDeliveryConfirmedEmail, sendDeliveryCompleteEmail } from '@/lib/email/sendDeliveryEmail';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    // Look up the token
    const { data: record, error: findErr } = await supabase
      .from('action_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gte('expires_at', nowIso)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!record) {
      return NextResponse.json({ error: 'This link has expired or already been used.' }, { status: 400 });
    }

    const { email, action_type, entity_id, payload } = record;

    // Set session cookie — log the user in
    const cookieStore = await cookies();
    const sessionToken = signAppSession({ email, verified: true });
    cookieStore.set(getSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Mark token as used
    await supabase
      .from('action_tokens')
      .update({ used: true, used_at: nowIso })
      .eq('id', record.id);

    // Execute the action
    let redirectTo = '/dashboard';
    let message = '';

    if (action_type === 'confirm_match' || action_type === 'decline_match') {
      const matchId = entity_id;
      redirectTo = `/matches/${matchId}`;

      if (action_type === 'confirm_match') {
        const role = payload?.role as 'sender' | 'traveler';
        const updateField = role === 'sender' ? 'sender_accepted' : 'traveler_accepted';

        await supabase
          .from('matches')
          .update({ [updateField]: true })
          .eq('id', matchId);

        // Check if both accepted now
        const { data: match } = await supabase
          .from('matches')
          .select('sender_accepted, traveler_accepted')
          .eq('id', matchId)
          .single();

        if (match?.sender_accepted && match?.traveler_accepted) {
          // Both accepted price — move to 'agreed', now require Terms acceptance
          await supabase
            .from('matches')
            .update({ status: 'agreed' })
            .eq('id', matchId);

          // Fetch full match to send terms emails
          const { data: fullMatch } = await supabase
            .from('matches')
            .select('sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
            .eq('id', matchId)
            .single();

          const trip = (fullMatch as any)?.sender_trip;
          if (trip) {
            const emailBase = {
              fromCity:    trip.from_city,
              toCity:      trip.to_city,
              travelDate:  trip.travel_date,
              agreedPrice: fullMatch?.agreed_price ?? 0,
              matchId,
            };
            await Promise.allSettled([
              fullMatch?.sender_email   && sendTermsAcceptanceEmail({ toEmail: fullMatch.sender_email,   role: 'sender',   ...emailBase }),
              fullMatch?.traveler_email && sendTermsAcceptanceEmail({ toEmail: fullMatch.traveler_email, role: 'traveler', ...emailBase }),
            ]);
          }

          redirectTo = `/commit?matchId=${matchId}`;
          message    = 'Price confirmed! Please read and accept our Terms & Conditions to continue.';
        } else {
          message = 'Confirmed! Waiting for the other party to accept.';
        }
      }

      if (action_type === 'decline_match') {
        await supabase
          .from('matches')
          .update({ status: 'declined' })
          .eq('id', matchId);
        message = 'Match declined.';
      }
    }

    if (action_type === 'accept_negotiation' || action_type === 'reject_negotiation') {
      const matchId = entity_id;
      redirectTo = `/matches/${matchId}`;
      const role = payload?.role as 'sender' | 'traveler';
      const acceptField = role === 'sender'
        ? 'sender_accepted_negotiation'
        : 'traveler_accepted_negotiation';

      if (action_type === 'accept_negotiation') {
        await supabase
          .from('matches')
          .update({ [acceptField]: true })
          .eq('id', matchId);

        const { data: match } = await supabase
          .from('matches')
          .select('sender_accepted_negotiation, traveler_accepted_negotiation, proposed_price')
          .eq('id', matchId)
          .single();

        if (match?.sender_accepted_negotiation && match?.traveler_accepted_negotiation) {
          await supabase
            .from('matches')
            .update({ negotiation_status: 'accepted', agreed_price: match.proposed_price })
            .eq('id', matchId);
        } else {
          await supabase
            .from('matches')
            .update({ negotiation_status: role === 'sender' ? 'sender_accepted' : 'traveler_accepted' })
            .eq('id', matchId);
        }
        message = 'Price accepted! Waiting for the other party.';
      }

      if (action_type === 'reject_negotiation') {
        await supabase
          .from('matches')
          .update({ negotiation_status: 'rejected', status: 'cancelled' })
          .eq('id', matchId);
        message = 'Negotiation rejected. The match has been cancelled.';
      }
    }

    if (action_type === 'confirm_collected') {
      const matchId = entity_id;
      redirectTo = `/matches/${matchId}`;
      await supabase
        .from('matches')
        .update({ booter_confirmed_delivery: true, booter_confirmed_at: nowIso })
        .eq('id', matchId);
      message = 'Collection confirmed!';
    }

    if (action_type === 'confirm_delivered') {
      const matchId = entity_id;
      redirectTo = `/matches/${matchId}`;
      await supabase
        .from('matches')
        .update({
          hooper_confirmed_receipt:    true,
          hooper_confirmed_condition:  true,
          hooper_confirmed_at:         nowIso,
        })
        .eq('id', matchId);

      // Check if carrier also confirmed → both done, notify admin to release payment
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('booter_confirmed_delivery, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city)')
        .eq('id', matchId)
        .single();

      if (updatedMatch?.booter_confirmed_delivery) {
        // Mark as delivery_confirmed
        await supabase
          .from('matches')
          .update({ status: 'delivery_confirmed' })
          .eq('id', matchId);

        const trip = (updatedMatch as any).sender_trip;
        await Promise.allSettled([
          sendAdminDeliveryConfirmedEmail({
            matchId,
            fromCity:      trip?.from_city    ?? '',
            toCity:        trip?.to_city      ?? '',
            senderEmail:   updatedMatch.sender_email,
            travelerEmail: updatedMatch.traveler_email,
            agreedPrice:   updatedMatch.agreed_price ?? 0,
          }),
          sendDeliveryCompleteEmail({ toEmail: updatedMatch.sender_email,   fromCity: trip?.from_city ?? '', toCity: trip?.to_city ?? '', matchId, role: 'sender' }),
          sendDeliveryCompleteEmail({ toEmail: updatedMatch.traveler_email, fromCity: trip?.from_city ?? '', toCity: trip?.to_city ?? '', matchId, role: 'traveler' }),
        ]);
      }

      message = 'Delivery confirmed! Your transaction is being finalised.';
    }

    return NextResponse.json({ ok: true, email, action_type, redirectTo, message });

  } catch (error) {
    console.error('confirm-action error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 }
    );
  }
}
