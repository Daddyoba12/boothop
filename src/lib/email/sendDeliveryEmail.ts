import { Resend } from 'resend';

const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

// ── Confirmation request emails (sent by cron after contact released) ──────────

export async function sendCarrierDeliveryReminderEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
  confirmToken: string;
}) {
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const confirmUrl = `${appUrl}/confirm?token=${params.confirmToken}`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Reminder: Confirm delivery | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Have you delivered the package?</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Please confirm that you have delivered the goods for your <strong>${params.fromCity} → ${params.toCity}</strong> trip.
          Your payment will be processed once both parties confirm.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ✅ Confirm I've Delivered →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          This link expires in 48 hours. If you have any issues, reply to this email.
        </p>
      </div>
    `,
    text: `Please confirm delivery for ${params.fromCity} → ${params.toCity}.\n\nConfirm: ${confirmUrl}`,
  });
}

export async function sendSenderReceiptReminderEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
  confirmToken: string;
}) {
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const confirmUrl = `${appUrl}/confirm?token=${params.confirmToken}`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Reminder: Confirm you received your package | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Have you received your package?</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Please confirm receipt of your goods for the <strong>${params.fromCity} → ${params.toCity}</strong> delivery.
          One click is all it takes.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ✅ Confirm I've Received My Package →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          This link expires in 48 hours.
        </p>
      </div>
    `,
    text: `Please confirm receipt of your package for ${params.fromCity} → ${params.toCity}.\n\nConfirm: ${confirmUrl}`,
  });
}

// ── Admin alert when both parties confirm delivery ─────────────────────────────

export async function sendAdminDeliveryConfirmedEmail(params: {
  matchId:       string;
  fromCity:      string;
  toCity:        string;
  senderEmail:   string;
  travelerEmail: string;
  agreedPrice:   number;
}) {
  const resend      = new Resend(process.env.RESEND_API_KEY);
  const releaseUrl  = `${appUrl}/api/admin/release-payment?matchId=${params.matchId}&adminKey=${process.env.ADMIN_SECRET}`;

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `[ACTION] Both confirmed delivery — release payment | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Payment Release Required</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Both parties confirmed delivery</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Both the sender and carrier have confirmed the delivery. Please release payment to the carrier now.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Sender (Hooper)</td><td style="padding:10px 14px;"><a href="mailto:${params.senderEmail}">${params.senderEmail}</a></td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Carrier (Booter)</td><td style="padding:10px 14px;"><a href="mailto:${params.travelerEmail}">${params.travelerEmail}</a></td></tr>
          <tr style="background:#eff6ff;"><td style="padding:12px 14px;color:#1e3a8a;font-weight:700;">Amount to release</td><td style="padding:12px 14px;font-weight:900;font-size:18px;color:#1d4ed8;">£${params.agreedPrice.toFixed(2)}</td></tr>
        </table>
        <a href="${releaseUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          💸 Confirm payment released to carrier →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin:16px 0 0;">Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Both parties confirmed delivery for ${params.fromCity} → ${params.toCity}.\nCarrier: ${params.travelerEmail}\nAmount: £${params.agreedPrice.toFixed(2)}\n\nRelease payment: ${releaseUrl}`,
  });
}

// ── Both parties notification: delivery complete ───────────────────────────────

export async function sendDeliveryCompleteEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
  role:     'sender' | 'traveler';
}) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const matchUrl  = `${appUrl}/matches/${params.matchId}`;
  const isSender  = params.role === 'sender';

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Delivery complete — thank you! | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🎉 Delivery complete!</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your <strong>${params.fromCity} → ${params.toCity}</strong> delivery has been completed successfully.
          ${isSender ? 'Your payment has been processed.' : 'Your payment is being released to your account.'}
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Thank you for using BootHop. We hope to see you again soon!
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View delivery summary →
        </a>
      </div>
    `,
    text: `Delivery complete for ${params.fromCity} → ${params.toCity}.\n\nThank you for using BootHop!\n\n${matchUrl}`,
  });
}
