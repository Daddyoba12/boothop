import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Called on the 1st of each month at 08:00 UTC.
// Sends monthly delivery summary + invoice to each active Priority Partner.

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  // Calculate previous month window
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const monthLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const invoiceNum = `BH-INV-${now.getFullYear()}${String(now.getMonth()).padStart(2, '0')}`;

  // Get all active Priority Partners
  const { data: partners, error } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, annual_fee, discount_pct, delivery_type')
    .eq('status', 'active');

  if (error) {
    console.error('priority-summaries: fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const partner of partners ?? []) {
    // Get their jobs for the previous month
    const { data: jobs } = await supabase
      .from('jobs')
      .select('reference, status, client_paid, delivery_type, delivered_at')
      .eq('client_email', partner.email)
      .eq('client_type', 'priority')
      .gte('created_at', prevMonthStart)
      .lte('created_at', prevMonthEnd)
      .order('created_at', { ascending: false });

    const completedJobs = (jobs ?? []).filter(j => j.status === 'delivered');
    const totalSpend    = completedJobs.reduce((sum, j) => sum + (j.client_paid ?? 0), 0);
    const discountSaved = Math.round(totalSpend * ((partner.discount_pct ?? 5) / 100));

    const jobRows = completedJobs.map(j => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 0;font-family:monospace;font-size:12px;">${j.reference}</td>
        <td style="padding:6px 0;font-size:13px;">${j.delivery_type === 'uk' ? 'UK' : 'International'}</td>
        <td style="padding:6px 0;font-size:13px;">${j.delivered_at ? new Date(j.delivered_at as string).toLocaleDateString('en-GB') : '—'}</td>
        <td style="padding:6px 0;font-weight:700;font-size:13px;">£${(j.client_paid ?? 0).toLocaleString()}</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from,
      to: partner.email,
      subject: `BootHop Priority — Monthly report · ${monthLabel} · ${invoiceNum}-${(partner.company_name || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span>
              <span style="font-size:12px;color:#64748b;margin-left:6px;">Priority Partner</span>
            </div>
            <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">Monthly Report</span>
          </div>

          <h2 style="margin:0 0 4px;font-size:20px;font-weight:900;">${monthLabel} — Delivery Summary</h2>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">${partner.company_name}</p>
          <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;">Invoice reference: <strong style="font-family:monospace;">${invoiceNum}-${(partner.company_name || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}</strong></p>

          <div style="display:flex;gap:12px;margin-bottom:24px;">
            <div style="flex:1;background:#fefce8;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#92400e;">Deliveries</p>
              <p style="margin:0;font-size:28px;font-weight:900;">${completedJobs.length}</p>
            </div>
            <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#16a34a;">Total spend</p>
              <p style="margin:0;font-size:28px;font-weight:900;color:#15803d;">£${totalSpend.toLocaleString()}</p>
            </div>
            ${discountSaved > 0 ? `
            <div style="flex:1;background:#eff6ff;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#2563eb;">Member saving</p>
              <p style="margin:0;font-size:28px;font-weight:900;color:#1d4ed8;">£${discountSaved.toLocaleString()}</p>
            </div>` : ''}
          </div>

          ${completedJobs.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr style="border-bottom:2px solid #e2e8f0;">
                <th style="padding:8px 0;text-align:left;color:#64748b;font-weight:600;">Reference</th>
                <th style="padding:8px 0;text-align:left;color:#64748b;font-weight:600;">Type</th>
                <th style="padding:8px 0;text-align:left;color:#64748b;font-weight:600;">Delivered</th>
                <th style="padding:8px 0;text-align:left;color:#64748b;font-weight:600;">Amount</th>
              </tr>
            </thead>
            <tbody>${jobRows}</tbody>
            <tfoot>
              <tr style="border-top:2px solid #0f172a;">
                <td colspan="3" style="padding:10px 0;font-weight:700;">Total</td>
                <td style="padding:10px 0;font-weight:900;font-size:16px;">£${totalSpend.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>` : `<p style="font-size:14px;color:#64748b;">No deliveries recorded in ${monthLabel}.</p>`}

          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;font-size:13px;margin-bottom:20px;">
            Your annual Priority Partner membership (£${(partner.annual_fee ?? 0).toLocaleString()}/yr) gives you ${partner.discount_pct ?? 5}% off all bookings, a 2-hour response SLA, and a dedicated account manager.
          </div>

          <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            Questions about this report? Contact your account manager or call <strong>+44 115 661 2825</strong> · <a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a>
          </p>
        </div>
      `,
      text: `BootHop Priority — ${monthLabel}\n${partner.company_name}\nInvoice: ${invoiceNum}\n\nDeliveries: ${completedJobs.length}\nTotal spend: £${totalSpend.toLocaleString()}\nMember saving: £${discountSaved.toLocaleString()}\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
