import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';
import { sendKycVerifiedEmail, sendBothKycVerifiedEmail } from '@/lib/email/sendKycEmail';
import { sendBothTermsAcceptedEmail } from '@/lib/email/sendTermsEmail';
import { sendAdminPaymentAlertEmail, sendPaymentRequestedEmail, sendCarrierPaymentProcessingEmail } from '@/lib/email/sendPaymentEmail';

const TERMS_VERSION = '2025-04-07';

// Admin-only overrides for cases where two parties agreed a price outside the
// app, or KYC needs to be bypassed (e.g. BootHop itself is the Booter/Hooper
// on this match, so individual Stripe Identity verification doesn't apply).
// Every action requires a reason, which is written to admin_alerts for audit.

const TERMINAL_STATUSES = new Set(['cancelled', 'declined', 'completed', 'disputed']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: matchId } = await params;
  const body = await request.json();
  const { action, reason } = body as { action?: string; reason?: string };

  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters.' }, { status: 400 });
  }
  if (!action || !['force_agree', 'bypass_kyc', 'force_terms', 'request_payment'].includes(action)) {
    return NextResponse.json({ error: 'action must be force_agree, bypass_kyc, force_terms, or request_payment.' }, { status: 400 });
  }
  // Terms acceptance is a legal signature — require an explicit second confirmation
  // from the client beyond the reason text, so this can't fire from a stray click.
  if (action === 'force_terms' && body.confirmed !== true) {
    return NextResponse.json({ error: 'force_terms requires confirmed: true.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
  const from = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, agreed_price,
      sender_kyc_status, traveler_kyc_status,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
  }
  if (TERMINAL_STATUSES.has(match.status)) {
    return NextResponse.json({ error: `Match is already ${match.status} — cannot override.` }, { status: 400 });
  }

  const tripRaw = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
  const trip = tripRaw as { from_city?: string; to_city?: string; travel_date?: string } | null;
  const fromCity = trip?.from_city ?? '';
  const toCity = trip?.to_city ?? '';

  // ── Force agree: parties agreed a price outside the app ──────────────────
  if (action === 'force_agree') {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'price must be a positive number.' }, { status: 400 });
    }
    if (match.status !== 'matched') {
      return NextResponse.json({ error: `Match status is '${match.status}' — force_agree only applies from 'matched'.` }, { status: 400 });
    }

    await supabase
      .from('matches')
      .update({
        agreed_price: price,
        sender_accepted: true,
        traveler_accepted: true,
        status: 'agreed',
      })
      .eq('id', matchId);

    await supabase.from('admin_alerts').insert({
      alert_type: 'admin_force_agree',
      match_id: matchId,
      email: session.email,
      message: `Admin ${session.email} force-agreed match ${matchId} at £${price}. Reason: ${reason.trim()}`,
      metadata: { price, reason: reason.trim() },
    });

    const notify = (toEmail: string) => sendResendEmail({
      from,
      to: toEmail,
      subject: `Your match price has been confirmed — ${fromCity} → ${toCity}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
          <div style="margin-bottom:24px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Your match price has been confirmed</h2>
          <p style="font-size:15px;color:#475569;margin:0 0 20px;">For your <strong>${fromCity} → ${toCity}</strong> match, BootHop has confirmed a price of <strong>£${price.toFixed(2)}</strong>.</p>
          <p style="font-size:14px;color:#475569;margin:0 0 24px;">Please log in and accept our Terms to continue to identity verification.</p>
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Go to Dashboard →</a>
        </div>
      `,
      text: `Your match price has been confirmed at £${price.toFixed(2)} for ${fromCity} → ${toCity}. Please log in and accept Terms to continue: ${appUrl}/dashboard`,
    });

    await Promise.allSettled([
      match.sender_email && notify(match.sender_email),
      match.traveler_email && notify(match.traveler_email),
    ]);

    return NextResponse.json({ ok: true, status: 'agreed', agreed_price: price });
  }

  // ── Bypass KYC for one party ──────────────────────────────────────────────
  if (action === 'bypass_kyc') {
    const role = body.role as 'sender' | 'traveler';
    if (!['sender', 'traveler'].includes(role)) {
      return NextResponse.json({ error: 'role must be sender or traveler.' }, { status: 400 });
    }

    const isSender = role === 'sender';
    const kycField = isSender ? 'sender_kyc_status' : 'traveler_kyc_status';
    const kycAtField = isSender ? 'sender_kyc_verified_at' : 'traveler_kyc_verified_at';
    const toEmail = isSender ? match.sender_email : match.traveler_email;

    await supabase
      .from('matches')
      .update({ [kycField]: 'verified', [kycAtField]: new Date().toISOString() })
      .eq('id', matchId);

    await supabase.from('admin_alerts').insert({
      alert_type: 'admin_bypass_kyc',
      match_id: matchId,
      email: session.email,
      message: `Admin ${session.email} bypassed KYC for ${role} on match ${matchId}. Reason: ${reason.trim()}`,
      metadata: { role, reason: reason.trim() },
    });

    const senderVerified = isSender ? true : match.sender_kyc_status === 'verified';
    const travelerVerified = !isSender ? true : match.traveler_kyc_status === 'verified';

    if (senderVerified && travelerVerified) {
      await supabase.from('matches').update({ status: 'kyc_complete' }).eq('id', matchId);

      await Promise.allSettled([
        match.sender_email && sendBothKycVerifiedEmail({
          toEmail: match.sender_email, fromCity, toCity, matchId, role: 'sender', agreedPrice: match.agreed_price ?? 0,
        }),
        match.traveler_email && sendBothKycVerifiedEmail({
          toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler', agreedPrice: match.agreed_price ?? 0,
        }),
      ]);

      return NextResponse.json({ ok: true, status: 'kyc_complete' });
    }

    if (toEmail) {
      await sendKycVerifiedEmail({ toEmail, fromCity, toCity, matchId }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: match.status, [kycField]: 'verified' });
  }

  // ── Force Terms acceptance for both parties ───────────────────────────────
  if (action === 'force_terms') {
    if (match.status !== 'agreed') {
      return NextResponse.json({ error: `Match status is '${match.status}' — force_terms only applies from 'agreed'.` }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const emails = [match.sender_email, match.traveler_email].filter(Boolean) as string[];

    for (const email of emails) {
      const { data: existing } = await supabase
        .from('terms_acceptance')
        .select('id')
        .eq('match_id', matchId)
        .eq('email', email)
        .maybeSingle();
      if (!existing) {
        await supabase.from('terms_acceptance').insert({
          match_id: matchId,
          email,
          terms_version: TERMS_VERSION,
          accepted: true,
          ip_address: `admin-override:${session.email}`,
          accepted_at: nowIso,
        });
      }
    }

    await supabase.from('matches').update({ status: 'committed' }).eq('id', matchId);

    await supabase.from('admin_alerts').insert({
      alert_type: 'admin_force_terms',
      match_id: matchId,
      email: session.email,
      message: `Admin ${session.email} force-accepted Terms on behalf of both parties on match ${matchId}. Reason: ${reason.trim()}`,
      metadata: { reason: reason.trim() },
    });

    await Promise.allSettled([
      match.sender_email && sendBothTermsAcceptedEmail({ toEmail: match.sender_email, fromCity, toCity, matchId }),
      match.traveler_email && sendBothTermsAcceptedEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId }),
    ]);

    return NextResponse.json({ ok: true, status: 'committed' });
  }

  // ── Request payment (admin-initiated, mirrors /api/payment/request) ──────
  if (action === 'request_payment') {
    if (!['kyc_complete', 'payment_pending'].includes(match.status)) {
      return NextResponse.json({ error: `Match status is '${match.status}' — request_payment needs 'kyc_complete' or 'payment_pending'.` }, { status: 400 });
    }
    if (!match.sender_email || !match.traveler_email) {
      return NextResponse.json({ error: 'Match is missing a sender or traveller email.' }, { status: 400 });
    }

    const totalDue = match.agreed_price ?? 0;
    const travelDate = trip?.travel_date ?? '';

    await supabase
      .from('matches')
      .update({ status: 'payment_processing' })
      .eq('id', matchId);

    await supabase.from('admin_alerts').insert({
      alert_type: 'admin_request_payment',
      match_id: matchId,
      email: session.email,
      message: `Admin ${session.email} manually requested payment of £${totalDue} from ${match.sender_email} on match ${matchId}. Reason: ${reason.trim()}`,
      metadata: { totalDue, reason: reason.trim() },
    });

    await Promise.allSettled([
      sendAdminPaymentAlertEmail({
        matchId, senderEmail: match.sender_email, travelerEmail: match.traveler_email,
        fromCity, toCity, travelDate, agreedPrice: match.agreed_price ?? 0,
        goodsValue: 0, insuranceAccepted: false, insuranceFee: 0, totalDue,
      }),
      sendPaymentRequestedEmail({ toEmail: match.sender_email, fromCity, toCity, totalDue, matchId }),
      sendCarrierPaymentProcessingEmail({ toEmail: match.traveler_email, fromCity, toCity, travelDate, agreedPrice: match.agreed_price ?? 0, matchId }),
    ]);

    return NextResponse.json({ ok: true, status: 'payment_processing', totalDue });
  }

  return NextResponse.json({ error: 'Unhandled action.' }, { status: 400 });
}
