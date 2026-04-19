import { Resend } from 'resend';

const from         = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const adminEmail   = process.env.ADMIN_EMAIL   || 'admin@boothop.com';
const supportEmail = process.env.SUPPORT_EMAIL || 'support@boothop.com';

export async function sendDisputeRaisedAdminEmail(params: {
  disputeId:     string;
  matchId:       string;
  raisedBy:      string;
  otherParty:    string;
  reason:        string;
  description:   string;
  fromCity:      string;
  toCity:        string;
  agreedPrice:   number;
}) {
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const adminUrl   = `${appUrl}/admin/hub?adminKey=${process.env.ADMIN_SECRET}`;

  await resend.emails.send({
    from,
    to: [adminEmail, supportEmail],
    subject: `[DISPUTE] ${params.fromCity} → ${params.toCity} — Action required`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef2f2;color:#991b1b;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Dispute Raised</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⚠️ A dispute has been raised</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">Payment is on hold until this dispute is resolved.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Raised by</td><td style="padding:10px 14px;">${params.raisedBy}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Other party</td><td style="padding:10px 14px;">${params.otherParty}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Amount in dispute</td><td style="padding:10px 14px;font-weight:700;">£${params.agreedPrice.toFixed(2)}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Reason</td><td style="padding:10px 14px;">${params.reason}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;vertical-align:top;">Details</td><td style="padding:10px 14px;">${params.description}</td></tr>
        </table>
        <a href="${adminUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Review in admin hub →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin:16px 0 0;">Dispute ID: ${params.disputeId} · Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Dispute raised for ${params.fromCity} → ${params.toCity}\nBy: ${params.raisedBy}\nReason: ${params.reason}\n\n${params.description}\n\nAdmin hub: ${adminUrl}`,
  });
}

export async function sendDisputeAcknowledgedEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  disputeId: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to: params.toEmail,
    replyTo: supportEmail,
    subject: `Dispute received — we're reviewing it | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">We've received your dispute</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your dispute for the <strong>${params.fromCity} → ${params.toCity}</strong> delivery has been logged.
          Payment is on hold while we investigate.
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Our support team will contact both parties within 24 hours. You may be asked to provide evidence (photos, messages, etc).
          Reply to this email if you have anything to add.
        </p>
        <p style="font-size:12px;color:#94a3b8;">Dispute reference: ${params.disputeId}</p>
      </div>
    `,
    text: `Dispute received for ${params.fromCity} → ${params.toCity}.\nReference: ${params.disputeId}\n\nOur team will be in touch within 24 hours. Reply to this email with any evidence.`,
  });
}

export async function sendDisputeNotifiedEmail(params: {
  toEmail:     string;
  fromCity:    string;
  toCity:      string;
  reason:      string;
  disputeId:   string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.toEmail,
    replyTo: supportEmail,
    subject: `A dispute has been raised on your delivery | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">A dispute has been raised</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The other party has raised a dispute regarding the <strong>${params.fromCity} → ${params.toCity}</strong> delivery.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin:0 0 20px;">
          <p style="margin:0 0 4px;font-size:12px;color:#991b1b;font-weight:600;text-transform:uppercase;">Reason given</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#7f1d1d;">${params.reason}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 20px;">
          Payment has been placed on hold while we investigate. Our support team will contact both parties within 24 hours. Please reply to this email with any evidence (photos, messages, etc.) that may help resolve this.
        </p>
        <p style="font-size:12px;color:#94a3b8;">Dispute reference: ${params.disputeId}</p>
      </div>
    `,
    text: `A dispute has been raised on your ${params.fromCity} → ${params.toCity} delivery.\nReason: ${params.reason}\n\nPayment is on hold. Our team will contact you within 24 hours.\nDispute reference: ${params.disputeId}`,
  });
}

export async function sendDisputeResolvedEmail(params: {
  toEmail:     string;
  fromCity:    string;
  toCity:      string;
  resolution:  string;
  note:        string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to: params.toEmail,
    replyTo: supportEmail,
    subject: `Dispute resolved | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Dispute resolved</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The dispute for your <strong>${params.fromCity} → ${params.toCity}</strong> delivery has been reviewed and resolved.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Decision</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${params.resolution}</p>
          ${params.note ? `<p style="margin:8px 0 0;font-size:13px;color:#475569;">${params.note}</p>` : ''}
        </div>
        <p style="font-size:13px;color:#475569;">If you have questions, reply to this email or contact ${supportEmail}.</p>
      </div>
    `,
    text: `Dispute resolved for ${params.fromCity} → ${params.toCity}.\nDecision: ${params.resolution}\n${params.note}`,
  });
}
