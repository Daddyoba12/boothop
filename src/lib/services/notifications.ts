import { sendResendEmail } from '@/lib/resend-client';
import { qrImageUrl } from '@/lib/utils/barcode';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

// ── Push (web-push) ──────────────────────────────────────────────────────────

export async function sendPushToEmail(
  supabase: any,
  email: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const { data } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_email', email)
    .single();

  if (!data?.subscription) return;

  try {
    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || `mailto:info@boothop.com`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    await webpush.sendNotification(data.subscription, JSON.stringify(payload));
  } catch { /* graceful */ }
}

// ── SMS & Voice (Telnyx — 70% cheaper than Twilio) ───────────────────────────

async function sendSMS(to: string, body: string): Promise<void> {
  if (!process.env.TELNYX_API_KEY) return;
  const { sendSMS: telnyxSMS } = await import('./telnyx');
  await telnyxSMS(to, body).catch(e => console.error('SMS failed:', e));
}

async function makeCall(to: string, message: string): Promise<void> {
  if (!process.env.TELNYX_API_KEY) return;
  const { makeCall: telnyxCall } = await import('./telnyx');
  await telnyxCall(to, message).catch(e => console.error('Call failed:', e));
}

// ── Barcode generation email ─────────────────────────────────────────────────

function tierBadgeHtml(tier: string, premium: boolean): string {
  const colors: Record<string, string> = { p2p: '#3b82f6', business: '#f59e0b', priority: '#10b981' };
  const labels: Record<string, string> = { p2p: 'P2P', business: 'Business', priority: 'Priority' };
  const bg = colors[tier] || '#3b82f6';
  return `<span style="background:${bg};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${labels[tier] || tier}</span>` +
    (premium ? `<span style="background:#7c3aed;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-left:8px;">⭐ Premium Tracking</span>` : '');
}

function barcodeEmailHtml(opts: {
  barcode: string; role: 'sender' | 'traveller'; fromCity: string; toCity: string;
  tier: string; premiumTracking: boolean; matchId: string;
}): string {
  const trackUrl = `${APP_URL}/track/${opts.barcode}`;
  const otherRole = opts.role === 'sender' ? 'traveller' : 'sender';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#07111f;color:#e2e8f0;margin:0;padding:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#10b981;font-size:28px;margin:0;">BootHop</h1>
    <p style="color:#94a3b8;margin:8px 0 0;">Your delivery is live</p>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;margin-bottom:24px;">
    <div style="text-align:center;margin-bottom:20px;">${tierBadgeHtml(opts.tier, opts.premiumTracking)}</div>
    <h2 style="color:#f1f5f9;text-align:center;margin:0 0 8px;">Your Tracking Barcode</h2>
    <p style="color:#94a3b8;text-align:center;margin:0 0 24px;">${opts.fromCity} → ${opts.toCity}</p>
    <div style="text-align:center;margin-bottom:20px;">
      <img src="${qrImageUrl(opts.barcode, 180)}" alt="QR" style="width:180px;height:180px;border-radius:8px;"/>
    </div>
    <div style="background:#0f172a;border:1px solid #1e40af;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;letter-spacing:1px;">YOUR BARCODE</p>
      <p style="color:#60a5fa;font-family:monospace;font-size:17px;font-weight:700;letter-spacing:2px;margin:0;">${opts.barcode}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${trackUrl}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Live Tracking</a>
    </div>
    <div style="border-top:1px solid #334155;padding-top:16px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 6px;">What you can do:</p>
      <ul style="color:#94a3b8;font-size:13px;margin:4px 0 0;padding-left:20px;line-height:1.8;">
        <li>Scan this QR code at any time to ${opts.role === 'sender' ? 'request a location update from your traveller' : 'share your location with the sender'}</li>
        <li>View your full tracking timeline at the link above</li>
        ${opts.premiumTracking ? '<li>Priority support: call +44 115 661 2825 or reply to this email</li>' : ''}
        ${opts.premiumTracking ? '<li>Unlimited location pings, photo proof at every checkpoint</li>' : ''}
      </ul>
    </div>
  </div>
  <p style="color:#475569;font-size:12px;text-align:center;">BootHop Ltd · Registered in England &amp; Wales · info@boothop.com</p>
</div></body></html>`;
}

export interface BarcodeNotificationOpts {
  senderEmail: string; travellerEmail: string;
  senderPhone?: string; travellerPhone?: string;
  senderBarcode: string; travellerBarcode: string;
  fromCity: string; toCity: string;
  tier: string; matchId: string; premiumTracking?: boolean;
  supabase?: any;
}

export async function sendBarcodeNotification(opts: BarcodeNotificationOpts): Promise<void> {
  const common = { fromCity: opts.fromCity, toCity: opts.toCity, tier: opts.tier, matchId: opts.matchId, premiumTracking: !!opts.premiumTracking };

  await Promise.allSettled([
    sendResendEmail({
      from: 'BootHop <noreply@boothop.com>',
      to: opts.senderEmail,
      subject: `Your BootHop tracking barcode — ${opts.fromCity} → ${opts.toCity}`,
      html: barcodeEmailHtml({ barcode: opts.senderBarcode, role: 'sender', ...common }),
    }),
    sendResendEmail({
      from: 'BootHop <noreply@boothop.com>',
      to: opts.travellerEmail,
      subject: `Your BootHop carrier barcode — ${opts.fromCity} → ${opts.toCity}`,
      html: barcodeEmailHtml({ barcode: opts.travellerBarcode, role: 'traveller', ...common }),
    }),
  ]);

  // Push notifications (if subscribed)
  if (opts.supabase) {
    await Promise.allSettled([
      sendPushToEmail(opts.supabase, opts.senderEmail, { title: 'BootHop — delivery live!', body: `Your barcode: ${opts.senderBarcode}`, url: `${APP_URL}/track/${opts.senderBarcode}` }),
      sendPushToEmail(opts.supabase, opts.travellerEmail, { title: 'BootHop — delivery assigned', body: `Your carrier barcode: ${opts.travellerBarcode}`, url: `${APP_URL}/track/${opts.travellerBarcode}` }),
    ]);
  }

  // SMS — Business and Priority tiers
  if (['business', 'priority'].includes(opts.tier)) {
    await Promise.allSettled([
      opts.senderPhone && sendSMS(opts.senderPhone, `BootHop: Your delivery barcode is ${opts.senderBarcode}. Track: ${APP_URL}/track/${opts.senderBarcode}`),
      opts.travellerPhone && sendSMS(opts.travellerPhone, `BootHop: Your carrier barcode is ${opts.travellerBarcode}. Sender may ping you for location. Track: ${APP_URL}/track/${opts.travellerBarcode}`),
    ]);
  }

  // Priority: phone call for high-value deliveries
  if (opts.tier === 'priority' && opts.travellerPhone) {
    await makeCall(opts.travellerPhone, `Hello, this is BootHop. Your delivery barcode is active for the route ${opts.fromCity} to ${opts.toCity}. Please check your email for your tracking barcode.`).catch(() => {});
  }
}

// ── Checkpoint notification ───────────────────────────────────────────────────

export interface CheckpointNotificationOpts {
  recipientEmail: string; recipientPhone?: string;
  checkpointType: string; location: string;
  senderBarcode: string; tier: string; supabase?: any;
}

const CHECKPOINT_LABELS: Record<string, string> = {
  pickup: '📦 Item picked up',
  transit: '✈️ In transit',
  delivered: '✅ Delivered',
  location_check: '📍 Location update',
};

export async function sendCheckpointNotification(opts: CheckpointNotificationOpts): Promise<void> {
  const label   = CHECKPOINT_LABELS[opts.checkpointType] || 'Update';
  const trackUrl = `${APP_URL}/track/${opts.senderBarcode}`;
  const subject = `BootHop: ${label}`;
  const textBody = `Your delivery checkpoint: ${label} at ${opts.location}`;

  await sendResendEmail({
    from: 'BootHop Tracking <noreply@boothop.com>',
    to: opts.recipientEmail,
    subject,
    html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
      <h2 style="color:#10b981;">${label}</h2>
      <p style="color:#94a3b8;">${textBody}</p>
      <a href="${trackUrl}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">View Full Timeline</a>
    </div>`,
  }).catch(() => {});

  if (opts.supabase) {
    await sendPushToEmail(opts.supabase, opts.recipientEmail, { title: label, body: textBody, url: trackUrl }).catch(() => {});
  }

  if (['business', 'priority'].includes(opts.tier) && opts.recipientPhone) {
    await sendSMS(opts.recipientPhone, `BootHop: ${label} at ${opts.location}. Track: ${trackUrl}`).catch(() => {});
  }
}

// ── Cost ledger ───────────────────────────────────────────────────────────────

export async function logCost(supabase: any, matchId: string, tier: string, action: string, cost: number, metadata?: object): Promise<void> {
  await supabase.from('delivery_costs').insert({ match_id: matchId, tier, action, cost, metadata: metadata || null }).catch(() => {});
}
