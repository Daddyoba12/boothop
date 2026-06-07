import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Every Monday at 09:00 UTC.
// Sends admin a full payment reconciliation report:
//   - Payments released this week
//   - Payments pending release (upcoming)
//   - Outstanding (payment_due_at passed, not yet released)
//   - Week's revenue vs payouts vs BootHop margin

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7 * 86400000).toISOString();
  const weekLabel = `${new Date(now.getTime() - 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const [
    { data: releasedThisWeek },
    { data: pendingRelease },
    { data: overdue },
    { data: weekJobs },
  ] = await Promise.all([
    supabase.from('jobs').select('reference, partner_rate, delivered_at, payment_released_at').not('payment_released_at', 'is', null).gte('payment_released_at', weekAgo),
    supabase.from('jobs').select('reference, partner_rate, payment_due_at, delivered_at').eq('status', 'delivered').is('payment_released_at', null).not('payment_due_at', 'is', null),
    supabase.from('jobs').select('reference, partner_rate, payment_due_at').eq('status', 'delivered').is('payment_released_at', null).not('payment_due_at', 'is', null).lte('payment_due_at', now.toISOString()),
    supabase.from('jobs').select('client_paid, partner_rate, boothop_margin, status').gte('created_at', weekAgo),
  ]);

  const releasedAmt = (releasedThisWeek ?? []).reduce((s, j) => s + (j.partner_rate ?? 0), 0);
  const pendingAmt  = (pendingRelease  ?? []).reduce((s, j) => s + (j.partner_rate ?? 0), 0);
  const overdueAmt  = (overdue        ?? []).reduce((s, j) => s + (j.partner_rate ?? 0), 0);
  const weekRevenue = (weekJobs       ?? []).filter(j => j.status === 'delivered').reduce((s, j) => s + (j.client_paid ?? 0), 0);
  const weekMargin  = (weekJobs       ?? []).filter(j => j.status === 'delivered').reduce((s, j) => s + (j.boothop_margin ?? 0), 0);

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `💷 Weekly payment reconciliation — ${weekLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span> <span style="font-size:12px;color:#64748b;">Payment Reconciliation</span></div>
        <h2 style="font-size:20px;margin:0 0 4px;">Weekly reconciliation</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 24px;">${weekLabel}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;width:220px;">Week's revenue (client)</td><td style="padding:10px 0;font-weight:900;font-size:16px;color:#059669;">£${weekRevenue.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">BootHop margin (30%)</td><td style="padding:10px 0;font-weight:700;color:#059669;">£${weekMargin.toLocaleString()}</td></tr>
          <tr style="border-bottom:2px solid #0f172a;"><td style="padding:10px 0;color:#64748b;">Partner payouts (70%)</td><td style="padding:10px 0;font-weight:700;">£${(weekRevenue - weekMargin).toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Released this week</td><td style="padding:10px 0;font-weight:700;color:#059669;">£${releasedAmt.toLocaleString()} (${releasedThisWeek?.length ?? 0} payments)</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0;color:#64748b;">Pending release</td><td style="padding:10px 0;font-weight:700;color:#f59e0b;">£${pendingAmt.toLocaleString()} (${pendingRelease?.length ?? 0} jobs)</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;">Overdue payments</td><td style="padding:10px 0;font-weight:700;color:${overdueAmt > 0 ? '#dc2626' : '#64748b'};">£${overdueAmt.toLocaleString()} (${overdue?.length ?? 0} jobs)</td></tr>
        </table>

        ${(overdue?.length ?? 0) > 0 ? `
        <div style="background:#fee2e2;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:13px;">
          <strong style="color:#dc2626;">⚠ ${overdue?.length} overdue payment${overdue!.length !== 1 ? 's' : ''} — process immediately</strong>
          <ul style="margin:8px 0 0;padding-left:20px;">
            ${(overdue ?? []).map(j => `<li>${j.reference} — £${(j.partner_rate ?? 0).toLocaleString()} (due ${new Date(j.payment_due_at as string).toLocaleDateString('en-GB')})</li>`).join('')}
          </ul>
        </div>` : ''}

        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">BootHop Finance · Weekly reconciliation · ${now.toLocaleDateString('en-GB')}</p>
      </div>
    `,
    text: `Weekly Payment Reconciliation — ${weekLabel}\n\nRevenue: £${weekRevenue.toLocaleString()}\nMargin (30%): £${weekMargin.toLocaleString()}\nReleased this week: £${releasedAmt.toLocaleString()}\nPending: £${pendingAmt.toLocaleString()}\nOverdue: £${overdueAmt.toLocaleString()} (${overdue?.length ?? 0} jobs)`,
  });

  return NextResponse.json({ ok: true, released: releasedThisWeek?.length ?? 0, pending: pendingRelease?.length ?? 0, overdue: overdue?.length ?? 0 });
}
