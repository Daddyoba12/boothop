import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'BootHop <noreply@boothop.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop-one.vercel.app';

// ─── Shared HTML wrapper ────────────────────────────────────────────────────
function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BootHop</title>
</head>
<body style="margin:0;padding:0;background:#0f1923;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#0d3b4f 0%,#0a2535 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:3px solid #00b4d8;">
          <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            ✈️ Boot<span style="color:#00b4d8;">Hop</span>
          </div>
          <div style="color:#7dd3e8;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Send Packages Globally · Instantly Matched</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#132030;padding:40px;border-radius:0 0 16px 16px;">
          ${content}

          <!-- FOOTER -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #1e3448;padding-top:24px;">
            <tr>
              <td style="text-align:center;color:#4a7a99;font-size:12px;line-height:1.8;">
                <div>© ${new Date().getFullYear()} BootHop Ltd. All rights reserved.</div>
                <div style="margin-top:4px;">
                  <a href="${APP_URL}" style="color:#00b4d8;text-decoration:none;">boothop.com</a> ·
                  <a href="${APP_URL}/privacy" style="color:#00b4d8;text-decoration:none;">Privacy</a> ·
                  <a href="${APP_URL}/terms" style="color:#00b4d8;text-decoration:none;">Terms</a>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Reusable button ────────────────────────────────────────────────────────
function button(text: string, href: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="background:linear-gradient(135deg,#00b4d8,#0077b6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;display:inline-block;letter-spacing:0.3px;">${text}</a>
  </div>`;
}

// ─── Heading ────────────────────────────────────────────────────────────────
function heading(emoji: string, title: string, subtitle: string): string {
  return `<div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;">${title}</h1>
    <p style="color:#7dd3e8;font-size:15px;margin:0;">${subtitle}</p>
  </div>`;
}

// ─── Info box ───────────────────────────────────────────────────────────────
function infoBox(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:10px 16px;color:#7dd3e8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:40%;">${r.label}</td>
      <td style="padding:10px 16px;color:#ffffff;font-size:14px;font-weight:500;">${r.value}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2a3d;border-radius:12px;margin:24px 0;border:1px solid #1e3f5a;">${rowsHtml}</table>`;
}

// ─── Body text ──────────────────────────────────────────────────────────────
function bodyText(text: string): string {
  return `<p style="color:#b8d4e3;font-size:15px;line-height:1.7;margin:0 0 16px;">${text}</p>`;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL
// ════════════════════════════════════════════════════════════════════════════
export async function sendWelcomeEmail(to: string, name: string) {
  const html = wrap(`
    ${heading('🎉', `Welcome to BootHop, ${name}!`, 'Your global delivery network starts here')}
    ${bodyText('You\'re now part of a community connecting senders and travelers across the globe. Whether you need a package delivered or you\'re travelling and want to earn, BootHop has you covered.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="48%" style="background:#0d2a3d;border-radius:12px;padding:20px;border:1px solid #1e3f5a;text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">📦</div>
          <div style="color:#ffffff;font-weight:700;font-size:15px;margin-bottom:4px;">Send a Package</div>
          <div style="color:#7dd3e8;font-size:13px;">Post your delivery and get matched instantly</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#0d2a3d;border-radius:12px;padding:20px;border:1px solid #1e3f5a;text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">✈️</div>
          <div style="color:#ffffff;font-weight:700;font-size:15px;margin-bottom:4px;">I'm Travelling</div>
          <div style="color:#7dd3e8;font-size:13px;">Earn money on your existing journey</div>
        </td>
      </tr>
    </table>

    ${bodyText('Your account is verified and ready to go. Complete your profile to build trust with the community.')}
    ${button('Get Started →', `${APP_URL}/dashboard`)}
    ${bodyText('Need help? Our support team is always here for you at <a href="mailto:support@boothop.com" style="color:#00b4d8;">support@boothop.com</a>')}
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🎉 Welcome to BootHop — Send Packages Globally!',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. MATCH NOTIFICATION EMAIL
// ════════════════════════════════════════════════════════════════════════════
interface MatchEmailProps {
  to: string;
  name: string;
  matchedWith: string;
  from: string;
  to_location: string;
  date: string;
  price: string;
  matchId: string;
}

export async function sendMatchNotificationEmail(props: MatchEmailProps) {
  const { to, name, matchedWith, from, to_location, date, price, matchId } = props;

  const html = wrap(`
    ${heading('🤝', 'You\'ve Got a Match!', `${matchedWith} is ready to make this happen`)}
    ${bodyText(`Great news ${name}! You've been matched on BootHop. Review the details below and confirm to get things moving.`)}

    ${infoBox([
      { label: '👤 Matched With', value: matchedWith },
      { label: '📍 From', value: from },
      { label: '📍 To', value: to_location },
      { label: '📅 Date', value: date },
      { label: '💷 Agreed Price', value: price },
    ])}

    ${bodyText('This match is waiting for your confirmation. Don\'t keep them waiting — confirm now to lock in your delivery!')}
    ${button('View Match →', `${APP_URL}/matches/${matchId}`)}
    ${bodyText('<strong style="color:#ffffff;">⏱ Note:</strong> Matches expire after 24 hours if not confirmed by both parties.')}
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `🤝 New Match on BootHop — ${from} → ${to_location}`,
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 3. PAYMENT CONFIRMATION EMAIL
// ════════════════════════════════════════════════════════════════════════════
interface PaymentEmailProps {
  to: string;
  name: string;
  amount: string;
  role: 'sender' | 'traveler';
  from: string;
  to_location: string;
  transactionId: string;
  date: string;
}

export async function sendPaymentConfirmationEmail(props: PaymentEmailProps) {
  const { to, name, amount, role, from, to_location, transactionId, date } = props;

  const isSender = role === 'sender';
  const emoji = isSender ? '💳' : '💰';
  const title = isSender ? 'Payment Confirmed!' : 'Payment Received!';
  const subtitle = isSender ? 'Your funds are held securely in escrow' : 'Your earnings are on their way';

  const html = wrap(`
    ${heading(emoji, title, subtitle)}

    <div style="background:linear-gradient(135deg,#003d52,#00253a);border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #00b4d8;">
      <div style="color:#7dd3e8;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${isSender ? 'Amount Secured' : 'Amount Earned'}</div>
      <div style="color:#00b4d8;font-size:42px;font-weight:900;">${amount}</div>
      <div style="color:#4a7a99;font-size:12px;margin-top:8px;">${isSender ? 'Released to traveler on delivery' : 'Transferred within 2-3 business days'}</div>
    </div>

    ${infoBox([
      { label: '🔖 Transaction ID', value: transactionId },
      { label: '📍 Route', value: `${from} → ${to_location}` },
      { label: '📅 Date', value: date },
      { label: '💷 Amount', value: amount },
      { label: '🔒 Status', value: isSender ? 'Held in Escrow' : 'Payment Released' },
    ])}

    ${bodyText(isSender
      ? 'Your payment is safely held in escrow and will be released to the traveler once you confirm delivery. This protects both parties.'
      : 'The sender has confirmed delivery. Your payment will be transferred to your account within 2-3 business days.'
    )}
    ${button('View Transaction →', `${APP_URL}/dashboard`)}
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${emoji} Payment ${isSender ? 'Confirmed' : 'Received'} — ${amount} | BootHop`,
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 4. KYC REQUIRED EMAIL (sent when match accepted, KYC step starts)
// ════════════════════════════════════════════════════════════════════════════
export async function sendKycRequiredEmail(to: string, name: string, matchId: string) {
  const html = wrap(`
    ${heading('🔐', 'One quick step — verify your identity', 'Required before your delivery can proceed')}
    ${bodyText(`Hi ${name}, your match has been confirmed! Before we can share contact details and proceed, <strong style="color:#ffffff;">both parties must complete a quick identity check</strong>.`)}
    ${bodyText('It takes about 2 minutes — you\'ll need your passport or driving licence and a selfie. This is powered by Stripe Identity and is fully secure.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2a3d;border-radius:12px;margin:24px 0;border:1px solid #1e3f5a;">
      <tr>
        <td style="padding:12px 16px;color:#7dd3e8;font-size:13px;">✅ Passport or Driving Licence scan</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#7dd3e8;font-size:13px;border-top:1px solid #1e3f5a;">✅ Live selfie face-match</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#7dd3e8;font-size:13px;border-top:1px solid #1e3f5a;">✅ Secured by Stripe Identity</td>
      </tr>
    </table>

    ${button('Start Identity Verification →', `${APP_URL}/kyc/${matchId}`)}
    ${bodyText('<strong style="color:#f59e0b;">⚠️ Note:</strong> No contact details will be shared until both parties complete verification and payment is secured.')}
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🔐 Action needed — verify your identity to proceed | BootHop',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. KYC COMPLETE — BOTH VERIFIED (sent to sender to trigger payment)
// ════════════════════════════════════════════════════════════════════════════
export async function sendKycCompleteEmail(
  to: string, name: string, matchId: string, role: 'sender' | 'traveler'
) {
  const isSender = role === 'sender';
  const html = wrap(`
    ${heading('✅', 'Both identities verified!', isSender ? 'One final step — pay into escrow' : 'Waiting for sender payment')}
    ${bodyText(`Hi ${name}, great news! Both you and your match have completed identity verification.`)}
    ${isSender
      ? bodyText('You\'re now ready to pay into escrow. Your funds will be held securely by Stripe and released only when both parties confirm delivery.')
      : bodyText('The sender has been notified to pay into escrow. You\'ll receive another email as soon as funds are secured and the delivery is live.')
    }
    ${isSender ? button('Pay into Escrow →', `${APP_URL}/kyc/${matchId}`) : ''}
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: '✅ Both verified — ' + (isSender ? 'please pay into escrow' : 'waiting for payment') + ' | BootHop',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 6. PASSWORD RESET EMAIL
// ════════════════════════════════════════════════════════════════════════════
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const html = wrap(`
    ${heading('🔑', 'Reset Your Password', 'We received a request to reset your password')}
    ${bodyText(`Hi ${name}, no worries — it happens to the best of us. Click the button below to set a new password. This link expires in <strong style="color:#ffffff;">1 hour</strong>.`)}
    ${button('Reset My Password →', resetUrl)}
    ${bodyText('If you didn\'t request this, you can safely ignore this email. Your password will remain unchanged.')}

    <div style="background:#0d2a3d;border-radius:12px;padding:16px;margin-top:24px;border-left:4px solid #f59e0b;">
      <p style="color:#f59e0b;font-size:13px;margin:0;font-weight:600;">⚠️ Security Notice</p>
      <p style="color:#b8d4e3;font-size:13px;margin:8px 0 0;">BootHop will never ask for your password via email or phone. If you\'re concerned about your account security, contact us at <a href="mailto:support@boothop.com" style="color:#00b4d8;">support@boothop.com</a></p>
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🔑 Reset your BootHop password',
    html,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// GENERIC sendEmail — used by /api/notifications/send
// ════════════════════════════════════════════════════════════════════════════
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

// ════════════════════════════════════════════════════════════════════════════
// emailTemplates — notification templates used by /api/notifications/send
// ════════════════════════════════════════════════════════════════════════════
export const emailTemplates = {
  newMatch: (name: string, itemName: string, matchId: string) => ({
    subject: `🤝 New match for "${itemName}" | BootHop`,
    html: wrap(`
      ${heading('🤝', `Match found, ${name}!`, `Someone wants to carry your item`)}
      ${bodyText(`A traveller has been matched for <strong style="color:#fff;">${itemName}</strong>. Review the details and confirm to get things moving.`)}
      ${button('View Match →', `${APP_URL}/matches/${matchId}`)}
    `),
  }),

  paymentReceived: (name: string, amount: string) => ({
    subject: `💰 Payment received — ${amount} | BootHop`,
    html: wrap(`
      ${heading('💰', `Payment received, ${name}!`, 'Your escrow payment has been confirmed')}
      ${bodyText(`Your escrow payment of <strong style="color:#00b4d8;">${amount}</strong> has been received and is safely held until delivery is confirmed.`)}
      ${button('View Dashboard →', `${APP_URL}/dashboard`)}
    `),
  }),

  deliveryConfirmed: (name: string, otherParty: string) => ({
    subject: '✅ Delivery confirmed | BootHop',
    html: wrap(`
      ${heading('✅', `Delivery confirmed, ${name}!`, 'Both parties have confirmed')}
      ${bodyText(`Your delivery with <strong style="color:#fff;">${otherParty}</strong> has been confirmed by both parties. Payment is being processed.`)}
      ${button('View Dashboard →', `${APP_URL}/dashboard`)}
    `),
  }),

  paymentReleased: (name: string, amount: string) => ({
    subject: `💵 Payment released — ${amount} | BootHop`,
    html: wrap(`
      ${heading('💵', `Payment released, ${name}!`, 'Funds are on their way')}
      ${bodyText(`<strong style="color:#00b4d8;">${amount}</strong> has been released and will arrive in your account within 2–3 business days.`)}
      ${button('View Dashboard →', `${APP_URL}/dashboard`)}
    `),
  }),

  newMessage: (name: string, senderName: string, matchId: string) => ({
    subject: `💬 New message from ${senderName} | BootHop`,
    html: wrap(`
      ${heading('💬', `New message, ${name}!`, `${senderName} sent you a message`)}
      ${bodyText(`You have a new message from <strong style="color:#fff;">${senderName}</strong>. Log in to reply.`)}
      ${button('Read Message →', `${APP_URL}/messages/${matchId}`)}
    `),
  }),

  newReview: (name: string, rating: number) => ({
    subject: `⭐ You received a ${rating}-star review | BootHop`,
    html: wrap(`
      ${heading('⭐', `New review, ${name}!`, `You received ${rating} star${rating === 1 ? '' : 's'}`)}
      ${bodyText(`Someone left you a <strong style="color:#f59e0b;">${rating}-star review</strong>. Your reputation on BootHop is growing!`)}
      ${button('View Profile →', `${APP_URL}/profile`)}
    `),
  }),
};