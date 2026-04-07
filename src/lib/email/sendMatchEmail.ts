import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendInterestEmail(params: {
  toEmail:      string;   // trip owner
  fromEmail:    string;   // interested party
  fromCity:     string;
  toCity:       string;
  travelDate:   string;
  offeredPrice: number;
  listingPrice: number;
  interestType: 'full_price' | 'offer';
  matchId:      string;
}) {
  const discount   = Math.round((1 - params.offeredPrice / params.listingPrice) * 100);
  const isOffer    = params.interestType === 'offer';
  const priceLabel = isOffer ? `£${params.offeredPrice} (${discount}% off)` : `£${params.offeredPrice} (Full Price)`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `${isOffer ? 'Offer received' : 'Someone is interested'} — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">
          ${isOffer ? '💰 You received an offer!' : '✅ Someone is interested in your trip!'}
        </h2>
        <p style="font-size:15px;color:#475569;margin:0 0 24px;">
          A BootHop user wants to connect with you on your <strong>${params.fromCity} → ${params.toCity}</strong> trip on <strong>${new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
        </p>
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Offered Price</p>
          <p style="margin:0;font-size:32px;font-weight:900;color:#1d4ed8;">${priceLabel}</p>
        </div>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin:0 0 24px;">
          View in Dashboard →
        </a>
        <p style="font-size:13px;color:#94a3b8;margin:0;border-top:1px solid #f1f5f9;padding-top:16px;">
          Log in to your BootHop dashboard to accept or decline this ${isOffer ? 'offer' : 'request'}.
        </p>
      </div>
    `,
    text: `Someone is interested in your ${params.fromCity} → ${params.toCity} trip. Offered price: ${priceLabel}. Log in at ${appUrl}/dashboard to respond.`,
  });
}

export async function sendMatchConfirmedEmail(params: {
  toEmail:      string;
  fromCity:     string;
  toCity:       string;
  travelDate:   string;
  price:        number;
  matchId:      string;
  acceptToken?: string;
  declineToken?: string;
}) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const acceptUrl = params.acceptToken  ? `${appUrl}/confirm?token=${params.acceptToken}`  : `${appUrl}/dashboard`;
  const declineUrl= params.declineToken ? `${appUrl}/confirm?token=${params.declineToken}` : `${appUrl}/dashboard`;
  const dateStr   = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `🎉 Match found — ${params.fromCity} → ${params.toCity} — Action required`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🎉 We found you a match!</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 24px;">
          Your <strong>${params.fromCity} → ${params.toCity}</strong> trip on <strong>${dateStr}</strong> has been matched with another BootHop user.
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;">Agreed Price</p>
          <p style="margin:0;font-size:32px;font-weight:900;color:#16a34a;">£${params.price}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 20px;font-weight:600;">Do you want to accept this match?</p>
        <div style="display:flex;gap:12px;margin:0 0 24px;">
          <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-right:12px;">
            ✅ Accept Match
          </a>
          <a href="${declineUrl}" style="display:inline-block;background:#ef4444;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
            ✗ Decline
          </a>
        </div>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:0;">
          These links expire in 72 hours. If you do not respond, the match will expire automatically.
        </p>
      </div>
    `,
    text: `We found a match for your ${params.fromCity} → ${params.toCity} trip. Agreed price: £${params.price}.\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}\n\nLinks expire in 72 hours.`,
  });
}
