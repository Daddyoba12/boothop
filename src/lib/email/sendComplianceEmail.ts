import { sendResendEmail } from '@/lib/resend-client';

const from       = process.env.AUTH_FROM_EMAIL  || 'BootHop <noreply@boothop.com>';
const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const adminEmail = process.env.ADMIN_EMAIL      || 'admin@boothop.com';

// ── Sender: please complete your declaration ──────────────────────────────────
export async function sendDeclarationPromptEmail(params: {
  toEmail:        string;
  fromCity:       string;
  toCity:         string;
  matchId:        string;
  hoursRemaining?: number;
}) {
  const { toEmail, fromCity, toCity, matchId, hoursRemaining = 48 } = params;
  const declareUrl = `${appUrl}/matches/${matchId}#declare`;
  const isReminder = hoursRemaining < 48;
  const urgency    = hoursRemaining <= 6 ? '⚠️ Urgent' : hoursRemaining <= 24 ? '⏰ Reminder' : '📋 Action required';

  await sendResendEmail({
    from,
    to: toEmail,
    subject: `${urgency}: Complete your item declaration — ${fromCity} → ${toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">
          ${isReminder
            ? `⏰ ${hoursRemaining} hours left to complete your declaration`
            : '📋 Payment confirmed — one quick step remaining'}
        </h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          ${isReminder
            ? `You have approximately <strong>${hoursRemaining} hours</strong> left to submit your item declaration for <strong>${fromCity} → ${toCity}</strong>. If the deadline passes, your booking will be cancelled and refunded automatically.`
            : `Your payment has been confirmed for <strong>${fromCity} → ${toCity}</strong>. Before we notify your carrier, you must complete a quick item declaration so we can clear your shipment for transit.`}
        </p>
        <div style="background:#fef9c3;border:2px solid #fbbf24;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
            This takes about 2 minutes. Your shipment cannot proceed without it.
          </p>
        </div>
        <a href="${declareUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Complete declaration →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${matchId} · You have ${hoursRemaining} hours from when payment was confirmed.
        </p>
      </div>
    `,
    text: `${isReminder ? `${hoursRemaining} hours remaining` : 'Payment confirmed — action required'}: Complete your item declaration for ${fromCity} → ${toCity}.\n\n${declareUrl}`,
  });
}

// ── Traveller: payment confirmed, awaiting compliance ─────────────────────────
export async function sendTravelerComplianceWaitEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
}) {
  const matchUrl = `${appUrl}/matches/${params.matchId}`;
  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Payment confirmed — compliance check underway | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Payment received — compliance check underway</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Payment has been confirmed for your <strong>${params.fromCity} → ${params.toCity}</strong> delivery. We are completing a quick compliance check on the shipment items before releasing contact details.
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          You will receive another email once the shipment is cleared for transit — usually within a few hours.
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View delivery details →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${params.matchId}
        </p>
      </div>
    `,
    text: `Payment confirmed for ${params.fromCity} → ${params.toCity}. Compliance check underway — we will notify you when cleared.\n\n${matchUrl}`,
  });
}

// ── Both parties: shipment cleared, contacts released ─────────────────────────
export async function sendComplianceApprovedEmail(params: {
  toEmail:    string;
  fromCity:   string;
  toCity:     string;
  travelDate: string;
  matchId:    string;
  otherEmail: string;
  role:       'sender' | 'traveler';
}) {
  const dateStr   = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const matchUrl  = `${appUrl}/matches/${params.matchId}`;
  const isSender  = params.role === 'sender';
  const roleLabel = isSender ? 'Carrier (Booter)' : 'Sender (Hooper)';

  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Shipment cleared ✅ — contact details released | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔓 Shipment cleared for transit</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your <strong>${params.fromCity} → ${params.toCity}</strong> delivery on <strong>${dateStr}</strong> has passed compliance review and is cleared for transit. You can now coordinate the handover directly.
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;">${roleLabel} contact</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#15803d;">${params.otherEmail}</p>
        </div>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View delivery details →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${params.matchId} · After handover, both parties must confirm collection and receipt to release payment.
        </p>
      </div>
    `,
    text: `Shipment cleared for ${params.fromCity} → ${params.toCity} on ${dateStr}.\n\n${roleLabel}: ${params.otherEmail}\n\nView details: ${matchUrl}`,
  });
}

// ── Both parties: shipment rejected ──────────────────────────────────────────
export async function sendComplianceRejectedEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
  reason?:  string;
  role:     'sender' | 'traveler';
}) {
  const isSender = params.role === 'sender';
  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Shipment rejected — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">❌ Shipment could not be cleared</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Unfortunately your <strong>${params.fromCity} → ${params.toCity}</strong> shipment could not be cleared for transit.
          ${params.reason ? `<br><br><strong>Reason:</strong> ${params.reason}` : ''}
        </p>
        ${isSender ? `
          <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">
              A full refund has been initiated. Please allow 3–5 business days for funds to return. Contact support@boothop.com with any questions.
            </p>
          </div>
        ` : `
          <p style="font-size:14px;color:#475569;margin:0 0 24px;">The sender has been notified and will receive a full refund. No action is required from you.</p>
        `}
        <p style="font-size:12px;color:#94a3b8;">Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Your ${params.fromCity} → ${params.toCity} shipment has been rejected.${params.reason ? ` Reason: ${params.reason}.` : ''}${isSender ? ' A full refund has been initiated.' : ''}`,
  });
}

// ── Sender: shipment timed out, refund issued ─────────────────────────────────
export async function sendComplianceTimeoutEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
}) {
  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Booking cancelled — declaration deadline missed | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏰ Booking cancelled — deadline passed</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your <strong>${params.fromCity} → ${params.toCity}</strong> booking has been cancelled because the item declaration was not submitted within the required 48-hour window.
        </p>
        <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">
            A full refund has been initiated. Please allow 3–5 business days. You can rebook at any time.
          </p>
        </div>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Back to dashboard →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Your ${params.fromCity} → ${params.toCity} booking has been cancelled — declaration deadline passed. A full refund has been initiated.\n\n${appUrl}/dashboard`,
  });
}

// ── Admin: manual review required ────────────────────────────────────────────
export async function sendAdminComplianceReviewEmail(params: {
  matchId:         string;
  senderEmail:     string;
  fromCity:        string;
  toCity:          string;
  itemDescription: string;
  itemCategory:    string;
  riskScore:       number;
  flags:           string[];
}) {
  const reviewUrl = `${appUrl}/admin/compliance/${params.matchId}`;
  const approveUrl = `${appUrl}/api/admin/compliance/approve`;

  await sendResendEmail({
    from,
    to: adminEmail,
    subject: `[COMPLIANCE] Manual review — ${params.fromCity} → ${params.toCity} — Risk ${params.riskScore}/100`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Compliance Review</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔍 Item declaration requires manual review</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Sender</td><td style="padding:10px 14px;">${params.senderEmail}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Item</td><td style="padding:10px 14px;">${params.itemDescription || '—'}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Category</td><td style="padding:10px 14px;">${params.itemCategory || '—'}</td></tr>
          <tr style="background:#fef3c7;"><td style="padding:10px 14px;color:#92400e;font-weight:700;">Risk Score</td><td style="padding:10px 14px;font-weight:900;color:#d97706;">${params.riskScore}/100</td></tr>
          ${params.flags.length ? `<tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Flags</td><td style="padding:10px 14px;color:#dc2626;font-weight:600;">${params.flags.join(', ')}</td></tr>` : ''}
        </table>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
            Review declaration →
          </a>
        </div>
        <p style="font-size:11px;color:#94a3b8;margin:0;">Match ID: ${params.matchId} · Use the admin hub to approve or reject.</p>
      </div>
    `,
    text: `Compliance review required.\nRoute: ${params.fromCity} → ${params.toCity}\nItem: ${params.itemDescription} (${params.itemCategory})\nRisk: ${params.riskScore}/100\nFlags: ${params.flags.join(', ')}\n\nReview: ${reviewUrl}`,
  });
}
