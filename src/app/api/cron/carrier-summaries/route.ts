import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Called every Monday at 08:00 UTC.
// Sends weekly earnings summary to each active carrier.

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  // Past 7 days window
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekEnd = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  // Get all active carriers
  const { data: carriers, error } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name')
    .eq('status', 'active')
    .eq('status_active', true);

  if (error) {
    console.error('carrier-summaries: fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const carrier of carriers ?? []) {
    // Get this carrier's jobs for the past week
    const { data: jobs } = await supabase
      .from('jobs')
      .select('reference, status, partner_rate, delivery_type, delivered_at, payment_released_at')
      .eq('partner_id', carrier.id)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false });

    const completedJobs  = (jobs ?? []).filter(j => j.status === 'delivered');
    const pendingJobs    = (jobs ?? []).filter(j => !['delivered', 'cancelled', 'failed'].includes(j.status));
    const weeklyEarnings = completedJobs.reduce((sum, j) => sum + (j.partner_rate ?? 0), 0);
    const pendingPayout  = completedJobs
      .filter(j => !j.payment_released_at)
      .reduce((sum, j) => sum + (j.partner_rate ?? 0), 0);

    const jobRows = completedJobs.map(j => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 0;font-family:monospace;">${j.reference}</td>
        <td style="padding:6px 0;">${j.delivery_type === 'uk' ? 'UK' : 'International'}</td>
        <td style="padding:6px 0;font-weight:700;color:#059669;">£${(j.partner_rate ?? 0).toLocaleString()}</td>
        <td style="padding:6px 0;font-size:12px;">${j.payment_released_at ? '✅ Paid' : '⏳ Due'}</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from,
      to: carrier.email,
      subject: `Weekly summary — ${weekStart}–${weekEnd} · ${completedJobs.length} job${completedJobs.length !== 1 ? 's' : ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;">
            <span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span>
            <span style="font-size:12px;color:#64748b;margin-left:6px;">Weekly Summary</span>
          </div>
          <h2 style="margin:0 0 4px;font-size:20px;font-weight:900;">Good morning, ${carrier.contact_name || carrier.company_name}.</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;">${weekStart} – ${weekEnd}</p>

          <div style="display:flex;gap:16px;margin-bottom:24px;">
            <div style="flex:1;background:#eff6ff;border-radius:10px;padding:16px 20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#2563eb;">Jobs completed</p>
              <p style="margin:0;font-size:28px;font-weight:900;">${completedJobs.length}</p>
            </div>
            <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:16px 20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#16a34a;">Week's earnings</p>
              <p style="margin:0;font-size:28px;font-weight:900;color:#15803d;">£${weeklyEarnings.toLocaleString()}</p>
            </div>
          </div>

          ${completedJobs.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr style="border-bottom:2px solid #e2e8f0;">
                <th style="padding:6px 0;text-align:left;color:#64748b;font-weight:600;">Reference</th>
                <th style="padding:6px 0;text-align:left;color:#64748b;font-weight:600;">Type</th>
                <th style="padding:6px 0;text-align:left;color:#64748b;font-weight:600;">Payout</th>
                <th style="padding:6px 0;text-align:left;color:#64748b;font-weight:600;">Status</th>
              </tr>
            </thead>
            <tbody>${jobRows}</tbody>
          </table>` : `<p style="font-size:14px;color:#64748b;">No completed jobs this week. New job alerts will continue to be sent to your email.</p>`}

          ${pendingPayout > 0 ? `
          <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;">
            <strong>£${pendingPayout.toLocaleString()} in earnings</strong> is pending release (within 1 week of job delivery confirmation).
          </div>` : ''}

          ${pendingJobs.length > 0 ? `
          <p style="font-size:13px;color:#64748b;margin-bottom:20px;">${pendingJobs.length} active job${pendingJobs.length !== 1 ? 's' : ''} in progress this week.</p>` : ''}

          <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">Questions: +44 115 661 2825 · <a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
        </div>
      `,
      text: `BootHop Weekly Summary — ${weekStart}–${weekEnd}\n\nJobs completed: ${completedJobs.length}\nEarnings: £${weeklyEarnings.toLocaleString()}\nPending payout: £${pendingPayout.toLocaleString()}\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
