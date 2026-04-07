import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendTermsAcceptanceEmail(params: {
  toEmail:    string;
  fromCity:   string;
  toCity:     string;
  travelDate: string;
  agreedPrice: number;
  matchId:    string;
  role:       'sender' | 'traveler';
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dateStr = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const commitUrl = `${appUrl}/commit?matchId=${params.matchId}`;
  const roleLabel = params.role === 'sender' ? 'Sender (Hooper)' : 'Carrier (Booter)';

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Action required — Read & Accept Terms to proceed | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Both parties have agreed — one step to go</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Great news — both you and your match have accepted the price for your
          <strong>${params.fromCity} → ${params.toCity}</strong> trip on <strong>${dateStr}</strong>.
        </p>
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Your role</p>
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1e3a8a;">${roleLabel}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Agreed Price</p>
          <p style="margin:0;font-size:24px;font-weight:900;color:#1d4ed8;">£${params.agreedPrice.toFixed(2)}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 20px;">
          Before we proceed to identity verification and payment, you <strong>must read and accept the BootHop Terms & Conditions</strong>.
          This is mandatory and takes less than 2 minutes.
        </p>
        <a href="${commitUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin:0 0 24px;">
          Read & Accept Terms →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:0;">
          This step is required before your identity can be verified and the transaction can proceed. If you do not accept within 12 hours, the match will be cancelled automatically.
        </p>
      </div>
    `,
    text: `Both parties have agreed on £${params.agreedPrice.toFixed(2)} for ${params.fromCity} → ${params.toCity}.\n\nPlease read and accept our Terms & Conditions to continue:\n${commitUrl}\n\nThis link expires in 12 hours.`,
  });
}

export async function sendBothTermsAcceptedEmail(params: {
  toEmail:    string;
  fromCity:   string;
  toCity:     string;
  matchId:    string;
}) {
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const kycUrl   = `${appUrl}/kyc?matchId=${params.matchId}`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Terms accepted — Complete your identity verification | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🎉 Terms accepted by both parties!</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Both you and your match have accepted the Terms & Conditions for your
          <strong>${params.fromCity} → ${params.toCity}</strong> trip.
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Your next step is to complete <strong>identity verification (KYC)</strong>. This is required before payment can be processed and contact details released.
        </p>
        <a href="${kycUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Complete Identity Verification →
        </a>
      </div>
    `,
    text: `Both parties have accepted the Terms & Conditions.\n\nComplete your identity verification here:\n${kycUrl}`,
  });
}
