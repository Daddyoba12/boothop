import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

export async function sendCarrierPaymentProcessingEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  travelDate: string;
  agreedPrice: number;
  matchId:   string;
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dateStr = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const matchUrl = `${appUrl}/matches/${params.matchId}`;
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Payment in progress — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏳ Payment is being processed</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Great news — the sender has submitted their payment for the <strong>${params.fromCity} → ${params.toCity}</strong> delivery on <strong>${dateStr}</strong>.
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;">Your agreed fee</p>
          <p style="margin:0;font-size:24px;font-weight:900;color:#15803d;">£${params.agreedPrice.toFixed(2)}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Our team is verifying the payment. Once confirmed, both your contact details will be released so you can coordinate the handover. This usually happens within a few hours.
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          View delivery details →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${params.matchId} · Do not make any travel arrangements until you receive the contact released email.
        </p>
      </div>
    `,
    text: `Payment in progress for ${params.fromCity} → ${params.toCity} on ${dateStr}.\nYour agreed fee: £${params.agreedPrice.toFixed(2)}\n\nWe will notify you once payment is confirmed and contact details are released.\n\nMatch: ${matchUrl}`,
  });
}

export async function sendAdminPaymentAlertEmail(params: {
  matchId:          string;
  senderEmail:      string;
  travelerEmail:    string;
  fromCity:         string;
  toCity:           string;
  travelDate:       string;
  agreedPrice:      number;
  goodsValue:       number;
  insuranceAccepted: boolean;
  insuranceFee:     number;
  totalDue:         number;
}) {
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const confirmUrl = `${appUrl}/api/admin/confirm-payment?matchId=${params.matchId}&adminKey=${process.env.ADMIN_SECRET}`;
  const dateStr    = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `[ACTION] Payment request — ${params.fromCity} → ${params.toCity} — £${params.totalDue.toFixed(2)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Admin Action Required</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">💰 New payment request</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          A sender has submitted a payment request. Send them a bank transfer / payment link and confirm below once you have received the funds.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Travel date</td><td style="padding:10px 14px;">${dateStr}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Sender (Hooper)</td><td style="padding:10px 14px;"><a href="mailto:${params.senderEmail}">${params.senderEmail}</a></td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Carrier (Booter)</td><td style="padding:10px 14px;"><a href="mailto:${params.travelerEmail}">${params.travelerEmail}</a></td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Delivery fee</td><td style="padding:10px 14px;">£${params.agreedPrice.toFixed(2)}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Goods declared value</td><td style="padding:10px 14px;">£${params.goodsValue.toFixed(2)}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Insurance (8%)</td><td style="padding:10px 14px;">${params.insuranceAccepted ? `£${params.insuranceFee.toFixed(2)}` : 'Not selected'}</td></tr>
          <tr style="background:#eff6ff;"><td style="padding:12px 14px;color:#1e3a8a;font-weight:700;font-size:15px;">TOTAL DUE</td><td style="padding:12px 14px;font-weight:900;font-size:18px;color:#1d4ed8;">£${params.totalDue.toFixed(2)}</td></tr>
        </table>

        <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
            ⚠️ Once you have received the payment, click the button below to release contact details to both parties.
          </p>
        </div>

        <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-bottom:16px;">
          ✅ Confirm payment received →
        </a>

        <p style="font-size:11px;color:#94a3b8;margin:16px 0 0;">Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Payment request for ${params.fromCity} → ${params.toCity}\nSender: ${params.senderEmail}\nCarrier: ${params.travelerEmail}\nTotal due: £${params.totalDue.toFixed(2)}\n\nConfirm payment: ${confirmUrl}`,
  });
}

export async function sendPaymentRequestedEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  totalDue:  number;
  matchId:   string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Payment request received — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏳ Payment request received</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Thank you — we have received your payment request for the <strong>${params.fromCity} → ${params.toCity}</strong> delivery.
        </p>
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Amount due</p>
          <p style="margin:0;font-size:24px;font-weight:900;color:#1d4ed8;">£${params.totalDue.toFixed(2)}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 16px;">
          Our team will contact you shortly with payment instructions (bank transfer details or a payment link).
          Once we confirm receipt, your contact details will be shared with the carrier automatically.
        </p>
        <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:0;">
          Match ID: ${params.matchId} · If you have questions, reply to this email.
        </p>
      </div>
    `,
    text: `Payment request received for ${params.fromCity} → ${params.toCity}.\nAmount due: £${params.totalDue.toFixed(2)}\n\nWe will contact you shortly with payment instructions.`,
  });
}

export async function sendContactReleasedEmail(params: {
  toEmail:        string;
  fromCity:       string;
  toCity:         string;
  travelDate:     string;
  matchId:        string;
  otherEmail:     string;
  role:           'sender' | 'traveler';
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dateStr = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const matchUrl  = `${appUrl}/matches/${params.matchId}`;
  const isSender  = params.role === 'sender';
  const roleLabel = isSender ? 'Carrier (Booter)' : 'Sender (Hooper)';

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Payment confirmed — Contact details released | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔓 Payment confirmed — you're all set!</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Payment has been received and verified. Your delivery for <strong>${params.fromCity} → ${params.toCity}</strong> on <strong>${dateStr}</strong> is now active.
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;">${roleLabel} contact</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#15803d;">${params.otherEmail}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          You can now contact each other directly to arrange the handover. View full delivery details below.
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View delivery details →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          After delivery, both parties must confirm collection and receipt to close the transaction.
        </p>
      </div>
    `,
    text: `Payment confirmed for ${params.fromCity} → ${params.toCity} on ${dateStr}.\n\n${roleLabel}: ${params.otherEmail}\n\nView details: ${matchUrl}`,
  });
}
