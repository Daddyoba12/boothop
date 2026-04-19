import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendMatchCancelledEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  travelDate: string;
  cancelledByYou: boolean;
  reason?:   string;
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dateStr = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Match cancelled — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">❌ Match cancelled</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          ${params.cancelledByYou
            ? `Your match for <strong>${params.fromCity} → ${params.toCity}</strong> on <strong>${dateStr}</strong> has been cancelled.`
            : `The other party has cancelled the match for <strong>${params.fromCity} → ${params.toCity}</strong> on <strong>${dateStr}</strong>.`}
        </p>
        ${params.reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 16px;margin:0 0 20px;"><p style="margin:0;font-size:13px;color:#7f1d1d;">Reason: ${params.reason}</p></div>` : ''}
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Your trip is still active on BootHop and we will continue looking for a new match.
        </p>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          View Dashboard →
        </a>
      </div>
    `,
    text: `Your match for ${params.fromCity} → ${params.toCity} on ${dateStr} has been cancelled. ${params.reason ? `Reason: ${params.reason}` : ''}\n\nYour trip remains active on BootHop. View your dashboard: ${appUrl}/dashboard`,
  });
}

export async function sendMatchDeclinedEmail(params: {
  toEmail:   string;
  fromCity:  string;
  toCity:    string;
  travelDate: string;
}) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const dateStr = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `Match declined — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Match declined</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The other party has declined the match for <strong>${params.fromCity} → ${params.toCity}</strong> on <strong>${dateStr}</strong>.
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          Don't worry — your trip is still active and we'll keep looking for the right match.
        </p>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          View Dashboard →
        </a>
      </div>
    `,
    text: `The other party declined the match for ${params.fromCity} → ${params.toCity} on ${dateStr}. Your trip remains active. View dashboard: ${appUrl}/dashboard`,
  });
}

export async function sendInterestEmail(params: {
  toEmail:      string;
  fromEmail:    string;
  fromCity:     string;
  toCity:       string;
  travelDate:   string;
  offeredPrice: number;
  listingPrice: number;
  interestType: 'full_price' | 'offer';
  matchId:      string;
  acceptToken?: string;
  declineToken?: string;
}) {
  const discount   = Math.round((1 - params.offeredPrice / params.listingPrice) * 100);
  const isOffer    = params.interestType === 'offer';
  const priceLabel = isOffer ? `£${params.offeredPrice} (${discount}% off)` : `£${params.offeredPrice} (Full Price)`;
  const acceptUrl  = params.acceptToken  ? `${appUrl}/confirm?token=${params.acceptToken}`  : `${appUrl}/dashboard`;
  const declineUrl = params.declineToken ? `${appUrl}/confirm?token=${params.declineToken}` : `${appUrl}/dashboard`;
  const dateStr    = params.travelDate ? new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `${isOffer ? 'Offer received' : 'Someone is interested'} — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:28px 36px;text-align:center;border-bottom:2px solid #1e40af;">
          <div style="font-size:26px;font-weight:900;color:#fff;">Boot<span style="color:#38bdf8;">Hop</span></div>
          <div style="color:#7dd3fc;font-size:11px;margin-top:4px;letter-spacing:1.5px;text-transform:uppercase;">New ${isOffer ? 'Offer' : 'Interest'}</div>
        </div>
        <div style="padding:32px 36px;">
          <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 6px;">
            ${isOffer ? '💰 You received an offer!' : '✅ Someone wants to connect!'}
          </h2>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
            A BootHop user is interested in your <strong style="color:#f1f5f9;">${params.fromCity} → ${params.toCity}</strong>${dateStr ? ` trip on <strong style="color:#f1f5f9;">${dateStr}</strong>` : ' trip'}.
          </p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:18px 22px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Offered Price</p>
            <p style="margin:0;font-size:30px;font-weight:900;color:#38bdf8;">${priceLabel}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">Click below to accept or decline — you'll be logged in automatically, no password needed.</p>
          <div style="display:flex;gap:12px;margin-bottom:28px;">
            <a href="${acceptUrl}" style="flex:1;display:block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 16px;border-radius:10px;font-weight:700;font-size:14px;text-align:center;">
              ✅ Accept
            </a>
            <a href="${declineUrl}" style="flex:1;display:block;background:#1e293b;border:1px solid #334155;color:#94a3b8;text-decoration:none;padding:14px 16px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;">
              ✗ Decline
            </a>
          </div>
          <p style="color:#475569;font-size:11px;margin:0;">Links expire in 72 hours. If you didn't expect this, ignore it — no action needed.</p>
        </div>
        <div style="background:#0f172a;border-top:1px solid #1e293b;padding:16px 36px;text-align:center;">
          <p style="color:#334155;font-size:11px;margin:0;">© BootHop · <a href="${appUrl}" style="color:#38bdf8;text-decoration:none;">boothop.com</a></p>
        </div>
      </div>
    `,
    text: `Someone is interested in your ${params.fromCity} → ${params.toCity} trip. Offered price: ${priceLabel}.\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}\n\nLinks expire in 72 hours.`,
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
