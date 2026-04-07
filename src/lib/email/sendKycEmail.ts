import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendKycVerifiedEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  matchId:   string;
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const kycUrl  = `${appUrl}/kyc?matchId=${params.matchId}`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Your identity is verified — waiting for your match | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Your identity has been verified</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your ID check for the <strong>${params.fromCity} → ${params.toCity}</strong> trip is complete.
          We are now waiting for the other party to complete their verification.
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          You'll receive another email as soon as both identities are confirmed and the next step is ready.
        </p>
        <a href="${kycUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Check verification status →
        </a>
      </div>
    `,
    text: `Your identity is verified for ${params.fromCity} → ${params.toCity}.\n\nWaiting for the other party to complete their verification.\n\nCheck status: ${kycUrl}`,
  });
}

export async function sendBothKycVerifiedEmail(params: {
  toEmail:     string;
  fromCity:    string;
  toCity:      string;
  matchId:     string;
  role:        'sender' | 'traveler';
  agreedPrice: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const kycUrl = `${appUrl}/kyc?matchId=${params.matchId}`;

  const isSender  = params.role === 'sender';
  const actionMsg = isSender
    ? 'You can now proceed to payment. Funds will be held in escrow until delivery is confirmed.'
    : 'The sender will now be notified to pay into escrow. You\'ll receive an email once payment is secured.';
  const ctaLabel  = isSender ? 'Proceed to Payment →' : 'View Match Status →';
  const ctaColor  = isSender ? '#16a34a' : '#2563eb';

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Both identities verified — ${isSender ? 'Proceed to payment' : 'Waiting for payment'} | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🎉 Both identities verified!</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Both parties have passed identity verification for the <strong>${params.fromCity} → ${params.toCity}</strong> trip.
        </p>
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Agreed delivery price</p>
          <p style="margin:0;font-size:24px;font-weight:900;color:#1d4ed8;">£${params.agreedPrice.toFixed(2)}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">${actionMsg}</p>
        <a href="${kycUrl}" style="display:inline-block;background:${ctaColor};color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ${ctaLabel}
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Contact details will only be released after payment is held in escrow.
        </p>
      </div>
    `,
    text: `Both identities verified for ${params.fromCity} → ${params.toCity} (£${params.agreedPrice.toFixed(2)}).\n\n${actionMsg}\n\n${kycUrl}`,
  });
}
