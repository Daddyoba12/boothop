import { sendResendEmail } from '@/lib/resend-client';

const FROM  = process.env.AUTH_FROM_EMAIL   ?? 'BootHop <noreply@boothop.com>';
const ADMIN = process.env.ADMIN_EMAIL       ?? 'admin@boothop.com';
const APP   = process.env.NEXT_PUBLIC_APP_URL ?? '';

export async function sendAdminExternalVerificationEmail(params: {
  matchId:       string;
  fromCity:      string;
  toCity:        string;
  senderEmail:   string;
  travelerEmail: string;
  riskScore:     number;
  flags:         string[];
  reason:        string;
  source:        'risk_engine' | 'admin_escalation';
}) {
  const { matchId, fromCity, toCity, senderEmail, travelerEmail, riskScore, flags, reason, source } = params;
  const adminUrl = `${APP}/admin/compliance/${matchId}`;

  return sendResendEmail({
    from:    FROM,
    to:      ADMIN,
    subject: `[BOOTHOP] External Verification Required — ${fromCity}→${toCity} (${matchId.slice(0, 8)})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="color:#f59e0b;margin:0 0 16px;">⚠️ External Verification Required</h2>
        <p style="color:#94a3b8;margin:0 0 20px;">Source: ${source === 'risk_engine' ? 'Risk Engine (automatic)' : 'Admin escalation'}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Route</td><td style="color:#e2e8f0;font-weight:600;">${fromCity} → ${toCity}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Risk score</td><td style="color:#f59e0b;font-weight:700;">${riskScore}/100</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Sender</td><td style="color:#e2e8f0;">${senderEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Carrier</td><td style="color:#e2e8f0;">${travelerEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Flags</td><td style="color:#fca5a5;font-weight:600;">${flags.join(', ')}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="color:#e2e8f0;">${reason}</td></tr>
        </table>
        <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Review in admin hub →</a>
      </div>
    `,
    text: `External Verification Required\nRoute: ${fromCity}→${toCity}\nRisk: ${riskScore}/100\nFlags: ${flags.join(', ')}\nReason: ${reason}\nReview: ${adminUrl}`,
  });
}

export async function sendExternalVerificationHoldEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
  role:     'sender' | 'traveler';
}) {
  const { toEmail, fromCity, toCity, matchId, role } = params;
  const matchUrl  = `${APP}/matches/${matchId}`;
  const isSender  = role === 'sender';

  return sendResendEmail({
    from:    FROM,
    to:      toEmail,
    subject: `Action required — external verification needed for your ${fromCity}→${toCity} shipment`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="color:#f59e0b;margin:0 0 8px;">External verification required</h2>
        <p style="color:#94a3b8;margin:0 0 20px;">${fromCity} → ${toCity}</p>
        <p style="color:#e2e8f0;line-height:1.6;margin:0 0 16px;">This item cannot proceed through the standard BootHop handover process. Independent verification is required before transportation.</p>
        <p style="color:#94a3b8;line-height:1.6;margin:0 0 20px;">${isSender
          ? 'Please view your match page for a list of approved verification providers near you. You will need to present your item at one of these facilities and obtain a verification reference number.'
          : 'The sender has been notified. You will receive an email once verification is complete and the handover inspection can proceed.'}</p>
        <a href="${matchUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">View match details →</a>
      </div>
    `,
    text: `External verification required for your ${fromCity}→${toCity} shipment.\n\nThis item cannot proceed through the standard BootHop handover process. Independent verification is required.\n\nView match: ${matchUrl}`,
  });
}

export async function sendAdminVerificationResultEmail(params: {
  matchId:    string;
  fromCity:   string;
  toCity:     string;
  result:     'approved' | 'rejected' | 'inconclusive';
  reference:  string | null;
  verifiedBy: string;
  notes:      string | null;
}) {
  const { matchId, fromCity, toCity, result, reference, verifiedBy, notes } = params;
  const adminUrl    = `${APP}/admin/compliance/${matchId}`;
  const resultLabel = result === 'approved' ? '✅ Approved' : result === 'rejected' ? '❌ Rejected' : '⚠️ Inconclusive';
  const nextStep    = result === 'approved'
    ? 'Shipment advanced to inspection_pending. Carrier notified to proceed with handover inspection.'
    : result === 'rejected'
    ? 'Shipment closed. Sender will receive refund notification.'
    : 'Shipment remains in external_verification_required. Another admin action is required — do not auto-advance.';

  return sendResendEmail({
    from:    FROM,
    to:      ADMIN,
    subject: `[BOOTHOP] Verification ${result} — ${fromCity}→${toCity} (${matchId.slice(0, 8)})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="margin:0 0 16px;">${resultLabel} — External Verification</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Route</td><td style="color:#e2e8f0;font-weight:600;">${fromCity} → ${toCity}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Result</td><td style="color:#e2e8f0;font-weight:700;">${result.toUpperCase()}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Reference</td><td style="color:#e2e8f0;">${reference ?? '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Recorded by</td><td style="color:#e2e8f0;">${verifiedBy}</td></tr>
          ${notes ? `<tr><td style="padding:8px 0;color:#64748b;">Notes</td><td style="color:#e2e8f0;">${notes}</td></tr>` : ''}
        </table>
        <p style="color:#94a3b8;margin:0 0 20px;">${nextStep}</p>
        <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;">View match →</a>
      </div>
    `,
    text: `Verification ${result} for ${fromCity}→${toCity}\nReference: ${reference ?? '—'}\nRecorded by: ${verifiedBy}\n${notes ? `Notes: ${notes}\n` : ''}${nextStep}\n\nView match: ${adminUrl}`,
  });
}
