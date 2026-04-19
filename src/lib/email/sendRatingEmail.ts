import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendRatingRequestEmail(params: {
  toEmail:     string;
  fromCity:    string;
  toCity:      string;
  matchId:     string;
  role:        'sender' | 'traveler';
  agreedPrice: number;
}) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const matchUrl  = `${appUrl}/matches/${params.matchId}`;
  const isCarrier = params.role === 'traveler';

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `${isCarrier ? '💸 Payment released — ' : ''}Rate your experience | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        ${isCarrier ? `
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;">Payment released</p>
          <p style="margin:0;font-size:24px;font-weight:900;color:#15803d;">£${params.agreedPrice.toFixed(2)}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#166534;">Your payment has been released. Thank you for delivering with BootHop.</p>
        </div>` : ''}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⭐ How did it go?</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your <strong>${params.fromCity} → ${params.toCity}</strong> delivery is complete.
          Please take a moment to rate your experience — it helps build trust on BootHop.
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Leave a rating →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Ratings are anonymous to the other party and help us maintain quality on the platform.
        </p>
      </div>
    `,
    text: `${isCarrier ? `Your payment of £${params.agreedPrice.toFixed(2)} has been released. ` : ''}Your BootHop delivery (${params.fromCity} → ${params.toCity}) is complete. Please rate your experience: ${matchUrl}`,
  });
}
