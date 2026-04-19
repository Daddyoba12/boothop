import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { signAppSession, getSessionCookieName } from '@/lib/auth/session';
import { sendTermsAcceptanceEmail } from '@/lib/email/sendTermsEmail';
import { sendAdminCarrierPayoutAlertEmail, sendDeliveryCompleteEmail, sendCarrierConfirmedEmail } from '@/lib/email/sendDeliveryEmail';
import { sendRatingRequestEmail } from '@/lib/email/sendRatingEmail';
import { sendMatchDeclinedEmail, sendMatchCancelledEmail } from '@/lib/email/sendMatchEmail';

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

    // Magic login — just authenticate and redirect, no DB action
    if (action_type === 'magic_login') {
      redirectTo = (payload as any)?.redirectTo || '/dashboard';
      message    = 'Logged in successfully.';
      return NextResponse.json({ ok: true, redirectTo, message, action_type });
    }

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
        // Fetch match before updating so we can email the other party
        const { data: declMatch } = await supabase
          .from('matches')
          .select('sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
          .eq('id', matchId)
          .single();

        await supabase
          .from('matches')
          .update({ status: 'declined' })
          .eq('id', matchId);

        if (declMatch) {
          const trip      = (declMatch as any).sender_trip;
          const otherEmail = declMatch.sender_email === email ? declMatch.traveler_email : declMatch.sender_email;
          await sendMatchDeclinedEmail({
            toEmail:    otherEmail,
            fromCity:   trip?.from_city   ?? '',
            toCity:     trip?.to_city     ?? '',
            travelDate: trip?.travel_date ?? '',
          }).catch(() => {});
        }
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

          // Both accepted the negotiated price — fire match-confirmed emails so both get accept/decline tokens
          const { data: fullNeg } = await supabase
            .from('matches')
            .select('sender_email, traveler_email, proposed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
            .eq('id', matchId)
            .single();
          if (fullNeg) {
            const negTrip = (fullNeg as any).sender_trip;
            const negAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
            const { Resend: ResendCls } = await import('resend');
            const negResend = new ResendCls(process.env.RESEND_API_KEY);
            const negFrom   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
            const sendNegConfirm = (toEmail: string) => negResend.emails.send({
              from: negFrom, to: toEmail,
              subject: `Price agreed — ${negTrip?.from_city} → ${negTrip?.to_city}`,
              html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
                <div style="margin-bottom:20px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
                <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Price agreed — confirm your match</h2>
                <p style="font-size:15px;color:#475569;margin:0 0 20px;">Both parties have agreed on a price of <strong>£${fullNeg.proposed_price}</strong> for <strong>${negTrip?.from_city} → ${negTrip?.to_city}</strong>. Please head to your dashboard to confirm the match and continue.</p>
                <a href="${negAppUrl}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Go to Dashboard →</a>
              </div>`,
              text: `Price agreed at £${fullNeg.proposed_price} for ${negTrip?.from_city} → ${negTrip?.to_city}. Visit your dashboard to confirm the match: ${negAppUrl}/dashboard`,
            });
            await Promise.allSettled([
              fullNeg.sender_email   && sendNegConfirm(fullNeg.sender_email),
              fullNeg.traveler_email && sendNegConfirm(fullNeg.traveler_email),
            ]);
          }
        } else {
          await supabase
            .from('matches')
            .update({ negotiation_status: role === 'sender' ? 'sender_accepted' : 'traveler_accepted' })
            .eq('id', matchId);
        }
        message = 'Price accepted! Waiting for the other party.';
      }

      if (action_type === 'reject_negotiation') {
        const { data: negMatch } = await supabase
          .from('matches')
          .select('sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
          .eq('id', matchId)
          .single();

        await supabase
          .from('matches')
          .update({ negotiation_status: 'rejected', status: 'cancelled' })
          .eq('id', matchId);

        if (negMatch) {
          const trip       = (negMatch as any).sender_trip;
          const otherEmail = negMatch.sender_email === email ? negMatch.traveler_email : negMatch.sender_email;
          await Promise.allSettled([
            sendMatchCancelledEmail({ toEmail: email,       fromCity: trip?.from_city ?? '', toCity: trip?.to_city ?? '', travelDate: trip?.travel_date ?? '', cancelledByYou: true  }),
            sendMatchCancelledEmail({ toEmail: otherEmail,  fromCity: trip?.from_city ?? '', toCity: trip?.to_city ?? '', travelDate: trip?.travel_date ?? '', cancelledByYou: false }),
          ]);
        }
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

      // Re-fetch to check if sender already confirmed — if so, trigger completion now
      const { data: collMatch } = await supabase
        .from('matches')
        .select('hooper_confirmed_receipt, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city)')
        .eq('id', matchId)
        .single();

      if (collMatch?.hooper_confirmed_receipt) {
        // Sender already confirmed — both done, auto-complete
        const collTrip     = (collMatch as any).sender_trip;
        const collFrom     = collTrip?.from_city   ?? '';
        const collTo       = collTrip?.to_city     ?? '';
        const collPrice    = collMatch.agreed_price ?? 0;
        const collPayout   = collPrice * 0.97;
        await supabase
          .from('matches')
          .update({ status: 'completed', payment_released_at: nowIso })
          .eq('id', matchId);
        await Promise.allSettled([
          sendAdminCarrierPayoutAlertEmail({ matchId, fromCity: collFrom, toCity: collTo, senderEmail: collMatch.sender_email, travelerEmail: collMatch.traveler_email, agreedPrice: collPrice, carrierPayout: collPayout }),
          sendRatingRequestEmail({ toEmail: collMatch.sender_email,   fromCity: collFrom, toCity: collTo, matchId, role: 'sender',   agreedPrice: collPrice }),
          sendRatingRequestEmail({ toEmail: collMatch.traveler_email, fromCity: collFrom, toCity: collTo, matchId, role: 'traveler', agreedPrice: collPrice }),
        ]);
        message = 'Delivery confirmed! Transaction complete.';
      } else if (collMatch?.sender_email) {
        // Sender hasn't confirmed yet — create a token and notify them
        const senderToken = await supabase
          .from('action_tokens')
          .insert({ email: collMatch.sender_email, action_type: 'confirm_delivered', entity_id: matchId, payload: { role: 'sender' }, expires_at: new Date(Date.now() + 48 * 3_600_000).toISOString() })
          .select('token')
          .single();
        const collTrip = (collMatch as any).sender_trip;
        if (senderToken.data?.token) {
          await sendCarrierConfirmedEmail({
            toEmail:      collMatch.sender_email,
            fromCity:     collTrip?.from_city ?? '',
            toCity:       collTrip?.to_city   ?? '',
            matchId,
            confirmToken: senderToken.data.token,
          }).catch(() => {});
        }
        message = 'Delivery confirmed! The sender has been notified to confirm receipt.';
      } else {
        message = 'Collection confirmed!';
      }
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
        // Both confirmed — auto-complete
        const trip       = (updatedMatch as any).sender_trip;
        const delFrom    = trip?.from_city ?? '';
        const delTo      = trip?.to_city   ?? '';
        const delPrice   = updatedMatch.agreed_price ?? 0;
        const delPayout  = delPrice * 0.97;
        await supabase
          .from('matches')
          .update({ status: 'completed', payment_released_at: nowIso })
          .eq('id', matchId);
        await Promise.allSettled([
          sendAdminCarrierPayoutAlertEmail({ matchId, fromCity: delFrom, toCity: delTo, senderEmail: updatedMatch.sender_email, travelerEmail: updatedMatch.traveler_email, agreedPrice: delPrice, carrierPayout: delPayout }),
          sendRatingRequestEmail({ toEmail: updatedMatch.sender_email,   fromCity: delFrom, toCity: delTo, matchId, role: 'sender',   agreedPrice: delPrice }),
          sendRatingRequestEmail({ toEmail: updatedMatch.traveler_email, fromCity: delFrom, toCity: delTo, matchId, role: 'traveler', agreedPrice: delPrice }),
        ]);
        message = 'Delivery confirmed! Transaction complete.';
      } else {
        message = 'Delivery confirmed! Your transaction is being finalised.';
      }
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
