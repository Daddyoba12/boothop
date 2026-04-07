import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendRatingRequestEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
}) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const matchUrl  = `${appUrl}/matches/${params.matchId}`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Rate your experience | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
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
    text: `Your BootHop delivery (${params.fromCity} → ${params.toCity}) is complete. Please rate your experience: ${matchUrl}`,
  });
}
