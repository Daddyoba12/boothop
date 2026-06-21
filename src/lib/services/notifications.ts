import { sendResendEmail } from '@/lib/resend-client';
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

// ── Tracking ready notification ───────────────────────────────────────────────

function trackingEmailHtml(opts: {
  role: 'sender' | 'traveller'; fromCity: string; toCity: string;
  matchId: string; travelDate?: string;
}): string {
  const trackUrl = `${APP_URL}/track/${opts.matchId}`;
  const isSender = opts.role === 'sender';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#07111f;color:#e2e8f0;margin:0;padding:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#3b82f6;font-size:28px;margin:0;">BootHop</h1>
    <p style="color:#94a3b8;margin:8px 0 0;">Your delivery is live</p>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;margin-bottom:24px;">
    <h2 style="color:#f1f5f9;text-align:center;margin:0 0 8px;">📦 Package Tracking Active</h2>
    <p style="color:#94a3b8;text-align:center;margin:0 0 24px;">${opts.fromCity} → ${opts.toCity}${opts.travelDate ? ` · ${opts.travelDate}` : ''}</p>
    <p style="color:#cbd5e1;margin:0 0 20px;line-height:1.6;">
      ${isSender
        ? 'Your package is now being tracked. You can follow the traveller\'s journey in real time, see journey milestones, and view the live map.'
        : 'Your delivery is live. Open the tracking page to start your journey — the sender will see your progress as you log each milestone.'}
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${trackUrl}" style="background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        ${isSender ? 'Track My Package' : 'Open Journey Tracker'}
      </a>
    </div>
    <div style="background:#0f172a;border:1px solid #1e3a8a;border-radius:8px;padding:16px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 8px;">Journey milestones:</p>
      <p style="color:#94a3b8;font-size:13px;margin:0;line-height:2;">
        📦 Package Collected → 🏢 At Departure Airport → ✈️ Flight Departed → 🛬 Flight Landed → 📍 At Destination → 🚗 Out for Delivery → ✅ Delivered
      </p>
    </div>
  </div>
  <p style="color:#475569;font-size:12px;text-align:center;">BootHop Ltd · Registered in England &amp; Wales · info@boothop.com</p>
</div></body></html>`;
}

export interface TrackingNotificationOpts {
  senderEmail: string;
  travellerEmail: string;
  senderPhone?: string;
  travellerPhone?: string;
  fromCity: string;
  toCity: string;
  travelDate?: string;
  matchId: string;
  supabase?: any;
}

export async function sendTrackingNotification(opts: TrackingNotificationOpts): Promise<void> {
  const common = { fromCity: opts.fromCity, toCity: opts.toCity, matchId: opts.matchId, travelDate: opts.travelDate };

  await Promise.allSettled([
    sendResendEmail({
      from: 'BootHop <noreply@boothop.com>',
      to: opts.senderEmail,
      subject: `Track your package — ${opts.fromCity} → ${opts.toCity}`,
      html: trackingEmailHtml({ role: 'sender', ...common }),
    }),
    sendResendEmail({
      from: 'BootHop <noreply@boothop.com>',
      to: opts.travellerEmail,
      subject: `Your BootHop delivery is live — ${opts.fromCity} → ${opts.toCity}`,
      html: trackingEmailHtml({ role: 'traveller', ...common }),
    }),
  ]);

  const trackUrl = `${APP_URL}/track/${opts.matchId}`;

  if (opts.supabase) {
    await Promise.allSettled([
      sendPushToEmail(opts.supabase, opts.senderEmail, {
        title: 'BootHop — delivery live!',
        body: `Track your package: ${opts.fromCity} → ${opts.toCity}`,
        url: trackUrl,
      }),
      sendPushToEmail(opts.supabase, opts.travellerEmail, {
        title: 'BootHop — start your journey',
        body: `Open the app to begin tracking: ${opts.fromCity} → ${opts.toCity}`,
        url: trackUrl,
      }),
    ]);
  }

  if (opts.senderPhone) {
    await sendSMS(opts.senderPhone, `BootHop: Your package is live! Track it here: ${trackUrl}`).catch(() => {});
  }
  if (opts.travellerPhone) {
    await sendSMS(opts.travellerPhone, `BootHop: Your delivery is active. Open the app to start your journey: ${trackUrl}`).catch(() => {});
  }
}

// ── Checkpoint notification ───────────────────────────────────────────────────

export interface MilestoneNotificationOpts {
  recipientEmail: string;
  recipientPhone?: string;
  eventType: string;
  matchId: string;
  supabase?: any;
}

const MILESTONE_LABELS: Record<string, string> = {
  collected:            '📦 Package collected',
  at_departure_airport: '🏢 At departure airport',
  flight_departed:      '✈️ Flight departed',
  flight_landed:        '🛬 Flight landed',
  at_destination:       '📍 At destination',
  out_for_delivery:     '🚗 Out for delivery',
  delivered:            '✅ Delivered',
  tracking_started:     '🟢 Journey tracking started',
  tracking_stopped:     '⚫ Journey tracking ended',
};

export async function sendMilestoneNotification(opts: MilestoneNotificationOpts): Promise<void> {
  const label = MILESTONE_LABELS[opts.eventType] || opts.eventType;
  const trackUrl = `${APP_URL}/track/${opts.matchId}`;

  await sendResendEmail({
    from: 'BootHop Tracking <noreply@boothop.com>',
    to: opts.recipientEmail,
    subject: `BootHop update: ${label}`,
    html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
      <h2 style="color:#3b82f6;">${label}</h2>
      <p style="color:#94a3b8;">Your package journey has been updated.</p>
      <a href="${trackUrl}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">View Live Tracking</a>
    </div>`,
  }).catch(() => {});

  if (opts.supabase) {
    await sendPushToEmail(opts.supabase, opts.recipientEmail, {
      title: label,
      body: 'Your package journey has been updated',
      url: trackUrl,
    }).catch(() => {});
  }

  if (opts.recipientPhone) {
    await sendSMS(opts.recipientPhone, `BootHop: ${label}. Track: ${trackUrl}`).catch(() => {});
  }
}

// ── Cost ledger ───────────────────────────────────────────────────────────────

export async function logCost(supabase: any, matchId: string, tier: string, action: string, cost: number, metadata?: object): Promise<void> {
  await supabase.from('delivery_costs').insert({ match_id: matchId, tier, action, cost, metadata: metadata || null }).catch(() => {});
}
