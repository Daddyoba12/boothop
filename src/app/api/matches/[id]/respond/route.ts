import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { sendMatchAcceptedEmail, sendMatchDeclinedEmail } from '@/lib/email/sendMatchEmail';
import { isIpBanned, isAccountBanned, evaluateFraud, banIp, banAccount, logFraudFlag } from '@/lib/services/fraud-engine';
import { checkItemCompliance } from '@/lib/services/item-compliance';

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
      .select(`id, status, sender_email, traveler_email, offered_price, agreed_price, sender_trip_id, traveler_trip_id, item_category,
        sender_trip:sender_trip_id(from_city, to_city, from_country, to_country, travel_date, auto_created),
        traveler_trip:traveler_trip_id(from_city, to_city, travel_date, auto_created)`)
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.status !== 'matched') {
      return NextResponse.json({ error: 'This match is no longer pending.' }, { status: 400 });
    }

    // Only the listing owner (non-auto_created trip side) can respond.
    // The person who expressed interest has the auto_created mirror trip.
    const senderEmail   = match.sender_email?.toLowerCase().trim();
    const travelerEmail = match.traveler_email?.toLowerCase().trim();
    const senderTrip    = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
    const travelerTrip  = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
    const ownerEmail    = senderTrip?.auto_created ? travelerEmail : senderEmail;

    if (email !== ownerEmail) {
      return NextResponse.json({ error: 'Only the listing owner can accept or decline.' }, { status: 403 });
    }

    // Derive the other party (Mr B — who expressed interest)
    const otherEmail = email === senderEmail ? travelerEmail : senderEmail;

    // Get route info — prefer sender_trip, fall back to traveler_trip
    const tripInfo = senderTrip ?? travelerTrip;
    const fromCity     = tripInfo?.from_city  ?? '';
    const toCity       = tripInfo?.to_city    ?? '';
    const travelDate   = tripInfo?.travel_date ?? '';
    const price        = match.agreed_price ?? match.offered_price ?? 0;
    const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

    if (action === 'accept') {
      // ── Fraud & ban checks ──────────────────────────────────────────────────
      const ip      = (request as Request & { headers: Headers }).headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
      const country = (request as Request & { headers: Headers }).headers.get('x-vercel-ip-country') ?? '';

      const [ipBanned, senderBanned, travellerBanned] = await Promise.all([
        isIpBanned(ip),
        isAccountBanned(email),
        isAccountBanned(travelerEmail ?? ''),
      ]);

      if (ipBanned) {
        return NextResponse.json({ error: 'Your access has been restricted.' }, { status: 403 });
      }
      if (senderBanned) {
        return NextResponse.json({ error: 'Your account has been restricted.' }, { status: 403 });
      }
      if (travellerBanned) {
        return NextResponse.json({ error: 'The traveller account has been restricted.' }, { status: 403 });
      }

      // Evaluate fraud risk and take action based on tier
      const fraudResult = await evaluateFraud(matchId, email, country);
      await logFraudFlag(email, fraudResult, matchId, ip);

      if (fraudResult.requiresBlock) {
        if (ip) await banIp(ip, `Critical fraud score ${fraudResult.score}`);
        await banAccount(email, `Critical fraud score ${fraudResult.score}`);
        await supabase.from('matches').update({ status: 'blocked', blocked_reason: `Fraud score ${fraudResult.score}` }).eq('id', matchId);
        await supabase.from('admin_alerts').insert({
          alert_type: 'critical_fraud',
          match_id:   matchId,
          email,
          message:    `Critical fraud detected. Score ${fraudResult.score}. Match blocked. IP: ${ip}, Country: ${country}`,
          metadata:   fraudResult.factors,
        });
        return NextResponse.json({ error: 'This match could not be processed.' }, { status: 403 });
      }

      if (fraudResult.requiresBan && ip) {
        await banIp(ip, `High fraud score ${fraudResult.score}`);
      }
      // ── End fraud checks ────────────────────────────────────────────────────

      // ── Item compliance check ───────────────────────────────────────────────
      const itemCategory = match.item_category;
      if (itemCategory) {
        const senderTripData  = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
        const fromCountry     = senderTripData?.from_country ?? country ?? '';
        const toCountry       = senderTripData?.to_country  ?? '';
        const compliance      = checkItemCompliance(itemCategory, fromCountry, toCountry);
        if (!compliance.allowed) {
          return NextResponse.json({ error: compliance.reason ?? 'Item not permitted on this route.' }, { status: 400 });
        }
      }
      // ── End compliance check ────────────────────────────────────────────────

      // ── Stripe Connect guard ────────────────────────────────────────────────
      // The traveller must have a verified payout account before either party
      // commits. Without this, they could carry a delivery and never receive money.
      const { data: travellerUser } = await supabase
        .from('users')
        .select('can_receive_payments, stripe_connect_id, stripe_onboarding_completed')
        .eq('email', travelerEmail)
        .maybeSingle();

      if (!travellerUser?.can_receive_payments) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
        const needsAccount = !travellerUser?.stripe_connect_id;
        return NextResponse.json({
          error: needsAccount
            ? 'The traveller has not set up their payout account. They must complete Stripe onboarding before this match can be accepted.'
            : 'The traveller\'s payout account is still being verified by Stripe (usually 24–48 hours). Please try again once verification is complete.',
          requiresOnboarding: needsAccount,
          onboardingUrl: `${appUrl}/traveller/onboarding`,
        }, { status: 402 });
      }
      // ── End guard ───────────────────────────────────────────────────────────

      // Move match to agreed — atomic: only succeeds if still in 'matched' status.
      // Prevents two simultaneous accepts both committing.
      const { data: acceptedRow } = await supabase
        .from('matches')
        .update({ status: 'agreed', agreed_price: price, sender_accepted: true, traveler_accepted: true })
        .eq('id', matchId)
        .eq('status', 'matched')
        .select('id')
        .maybeSingle();

      if (!acceptedRow) {
        return NextResponse.json({ error: 'Match is no longer available.' }, { status: 409 });
      }

      // Create magic login token for Mr B so they land on their dashboard
      if (otherEmail) {
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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

      // Release the original listing back to active so other users can match with it
      const originalTripId = senderTrip?.auto_created ? match.traveler_trip_id : match.sender_trip_id;
      if (originalTripId) {
        await supabase.from('trips').update({ status: 'active' }).eq('id', originalTripId);
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
