import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Daily at 18:00 UTC.
// Sends end-of-day performance report to admin.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo    = new Date(now.getTime() - 7 * 86400000).toISOString();
  const dateLabel  = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const [
    { data: todayJobs },
    { data: weekJobs },
    { data: activeCarriers },
    { data: pendingPayments },
    { data: openApplications },
  ] = await Promise.all([
    supabase.from('jobs').select('id, status, client_paid, partner_rate, boothop_margin, delivery_type, is_boothop_direct').gte('created_at', todayStart),
    supabase.from('jobs').select('id, status, client_paid, boothop_margin').gte('created_at', weekAgo),
    supabase.from('carrier_profiles').select('id', { count: 'exact' }).eq('status', 'active').eq('status_active', true),
    supabase.from('jobs').select('id, partner_rate').eq('status', 'delivered').is('payment_released_at', null),
    supabase.from('carrier_profiles').select('id', { count: 'exact' }).eq('status', 'payment_pending'),
  ]);

  const today = todayJobs ?? [];
  const week  = weekJobs  ?? [];

  const todayDelivered = today.filter(j => j.status === 'delivered');
  const todayRevenue   = todayDelivered.reduce((s, j) => s + (j.client_paid ?? 0), 0);
  const todayMargin    = todayDelivered.reduce((s, j) => s + (j.boothop_margin ?? 0), 0);
  const todayDirect    = todayDelivered.filter(j => j.is_boothop_direct).length;
  const weekRevenue    = week.filter(j => j.status === 'delivered').reduce((s, j) => s + (j.client_paid ?? 0), 0);
  const weekMargin     = week.filter(j => j.status === 'delivered').reduce((s, j) => s + (j.boothop_margin ?? 0), 0);
  const pendingPayout  = (pendingPayments ?? []).reduce((s, j) => s + (j.partner_rate ?? 0), 0);
  const openApps       = (openApplications as unknown as { count?: number } | null)?.count ?? 0;

  await sendResendEmail({
    from,
    to: adminEmail,
    subject: `📊 Daily report — ${dateLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span> <span style="font-size:12px;color:#64748b;">Daily Report</span></div>
        <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;">${dateLabel}</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:13px;">End-of-day performance summary</p>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
          ${[
            { l: 'Jobs received today', v: today.length, c: '#2563eb' },
            { l: 'Delivered today',     v: todayDelivered.length, c: '#059669' },
            { l: 'BootHop Direct',      v: todayDirect, c: '#f59e0b' },
          ].map(s => `<div style="background:#f8fafc;border-radius:10px;padding:14px 16px;text-align:center;"><p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;">${s.l}</p><p style="margin:0;font-size:24px;font-weight:900;color:${s.c};">${s.v}</p></div>`).join('')}
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:200px;">Today's revenue</td><td style="padding:8px 0;font-weight:900;font-size:16px;color:#059669;">£${todayRevenue.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Today's margin (30%)</td><td style="padding:8px 0;font-weight:700;">£${todayMargin.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Week's revenue (7d)</td><td style="padding:8px 0;font-weight:700;">£${weekRevenue.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Week's margin (7d)</td><td style="padding:8px 0;font-weight:700;">£${weekMargin.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Payments pending release</td><td style="padding:8px 0;font-weight:700;color:#f59e0b;">£${pendingPayout.toLocaleString()} (${pendingPayments?.length ?? 0} jobs)</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Active carriers</td><td style="padding:8px 0;font-weight:700;">${(activeCarriers as unknown as { count?: number } | null)?.count ?? 0}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Open carrier applications</td><td style="padding:8px 0;font-weight:700;${openApps > 0 ? 'color:#f59e0b;' : ''}">${openApps}</td></tr>
        </table>

        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">BootHop Ops · Automated daily report · ${new Date().toLocaleDateString('en-GB')}</p>
      </div>
    `,
    text: `BootHop Daily Report — ${dateLabel}\n\nJobs today: ${today.length}\nDelivered: ${todayDelivered.length}\nBootHop Direct: ${todayDirect}\nRevenue: £${todayRevenue.toLocaleString()}\nMargin: £${todayMargin.toLocaleString()}\nPending payouts: £${pendingPayout.toLocaleString()}\nActive carriers: ${(activeCarriers as unknown as { count?: number } | null)?.count ?? 0}\nOpen applications: ${openApps}`,
  });

  return NextResponse.json({ ok: true });
}
