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

// ── Notify sender that carrier has confirmed — pending sender's confirmation ───

export async function sendCarrierConfirmedEmail(params: {
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
    subject: `Carrier confirmed delivery — please confirm receipt | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">📦 Your carrier has confirmed delivery</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The carrier for your <strong>${params.fromCity} → ${params.toCity}</strong> delivery has confirmed the goods were delivered.
          Please confirm that you have received your package to release their payment.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ✅ Confirm I've Received My Package →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          This link expires in 48 hours. If you have an issue with the delivery, please raise a dispute instead.
        </p>
      </div>
    `,
    text: `Your carrier confirmed delivery for ${params.fromCity} → ${params.toCity}. Please confirm receipt to release their payment.\n\nConfirm: ${confirmUrl}`,
  });
}

// ── Escalation: active match stuck with no confirmation after 72h ──────────────

export async function sendDeliveryEscalationEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  matchId:   string;
  role:      'sender' | 'traveler';
  confirmToken: string;
}) {
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const confirmUrl = `${appUrl}/confirm?token=${params.confirmToken}`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@boothop.com';
  const isSender   = params.role === 'sender';
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `⚠️ Action required — delivery confirmation overdue | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Urgent</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⚠️ Your confirmation is overdue</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          We still haven't received your confirmation for the <strong>${params.fromCity} → ${params.toCity}</strong> delivery.
          ${isSender ? 'Please confirm you have received your goods.' : 'Please confirm you have delivered the goods.'}
          ${isSender ? 'The carrier\'s payment cannot be released until you confirm.' : 'Your payment cannot be released until both parties confirm.'}
        </p>
        <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:12px 16px;margin:0 0 20px;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">If you have a problem with the delivery, please raise a dispute rather than ignoring this message.</p>
        </div>
        <a href="${confirmUrl}" style="display:inline-block;background:${isSender ? '#16a34a' : '#2563eb'};color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-right:12px;">
          ${isSender ? '✅ Confirm I\'ve Received' : '✅ Confirm I\'ve Delivered'} →
        </a>
        <p style="font-size:13px;color:#475569;margin:20px 0 0;">
          Or reply to this email / contact <a href="mailto:${supportEmail}" style="color:#2563eb;">${supportEmail}</a> if you need help.
        </p>
      </div>
    `,
    text: `Action required: confirm your ${isSender ? 'receipt' : 'delivery'} for ${params.fromCity} → ${params.toCity}.\n\nConfirm: ${confirmUrl}\n\nIf there is a problem, contact ${supportEmail}`,
  });
}

// ── Admin payout alert when delivery auto-completes ───────────────────────────

export async function sendAdminCarrierPayoutAlertEmail(params: {
  matchId:       string;
  fromCity:      string;
  toCity:        string;
  senderEmail:   string;
  travelerEmail: string;
  agreedPrice:   number;
  carrierPayout: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `[PAYOUT] Transfer £${params.carrierPayout.toFixed(2)} to carrier | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Carrier Payout</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">💸 Delivery complete — transfer to carrier</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Both parties confirmed delivery. The match has been automatically completed. Please transfer the carrier's payout via bank transfer.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Sender (Hooper)</td><td style="padding:10px 14px;"><a href="mailto:${params.senderEmail}">${params.senderEmail}</a></td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Carrier (Booter)</td><td style="padding:10px 14px;"><a href="mailto:${params.travelerEmail}">${params.travelerEmail}</a></td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Agreed price</td><td style="padding:10px 14px;">£${params.agreedPrice.toFixed(2)}</td></tr>
          <tr style="background:#f0fdf4;border:2px solid #86efac;"><td style="padding:12px 14px;color:#166534;font-weight:700;font-size:15px;">Carrier receives (97%)</td><td style="padding:12px 14px;font-weight:900;font-size:20px;color:#15803d;">£${params.carrierPayout.toFixed(2)}</td></tr>
        </table>
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">Contact the carrier at ${params.travelerEmail} for their bank details if not already on file.</p>
        </div>
        <p style="font-size:11px;color:#94a3b8;margin:16px 0 0;">Match ID: ${params.matchId} · Rating emails have been automatically sent to both parties.</p>
      </div>
    `,
    text: `Carrier payout for ${params.fromCity} → ${params.toCity}\nCarrier: ${params.travelerEmail}\nTransfer amount: £${params.carrierPayout.toFixed(2)}\n\nMatch ID: ${params.matchId}`,
  });
}

// ── Legacy: kept for backwards compatibility, prefer sendAdminCarrierPayoutAlertEmail ──
export async function sendAdminDeliveryConfirmedEmail(params: {
  matchId:       string;
  fromCity:      string;
  toCity:        string;
  senderEmail:   string;
  travelerEmail: string;
  agreedPrice:   number;
}) {
  return sendAdminCarrierPayoutAlertEmail({
    ...params,
    carrierPayout: params.agreedPrice * 0.97,
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
