import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 07:30 UTC.
// Alerts admin of all partner payments that will become due in the next 3 days,
// so they can prepare bank transfers in advance.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const in3days = new Date(Date.now() + 3 * 86400000).toISOString();

  // Jobs where payment_due_at is within 3 days and not yet released
  const { data: upcoming } = await supabase
    .from('jobs')
    .select(`
      reference, partner_rate, payment_due_at, delivered_at,
      carrier_profiles!partner_id(company_name, bank_account_name, sort_code, account_number, email)
    `)
    .eq('status', 'delivered')
    .is('payment_released_at', null)
    .not('payment_due_at', 'is', null)
    .lte('payment_due_at', in3days)
    .order('payment_due_at', { ascending: true });

  if (!upcoming || upcoming.length === 0) {
    return NextResponse.json({ ok: true, upcoming: 0 });
  }

  const totalDue = upcoming.reduce((s, j) => s + (j.partner_rate ?? 0), 0);

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `💷 ${upcoming.length} partner payment${upcoming.length !== 1 ? 's' : ''} due in 3 days — £${totalDue.toLocaleString()} total`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span> <span style="font-size:12px;color:#64748b;">Payment Alert</span></div>
        <h2 style="font-size:20px;margin:0 0 4px;">Upcoming partner payments</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 24px;">Due within 3 days — total: £${totalDue.toLocaleString()}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="border-bottom:2px solid #e2e8f0;">
            <th style="text-align:left;padding:8px 0;color:#64748b;">Job</th>
            <th style="text-align:left;padding:8px 0;color:#64748b;">Carrier</th>
            <th style="text-align:left;padding:8px 0;color:#64748b;">Amount</th>
            <th style="text-align:left;padding:8px 0;color:#64748b;">Due</th>
          </tr></thead>
          <tbody>
            ${upcoming.map(j => {
              const carrier = (j as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
              const daysLeft = Math.ceil((new Date(j.payment_due_at as string).getTime() - Date.now()) / 86400000);
              return `<tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0;font-family:monospace;">${j.reference}</td>
                <td style="padding:8px 0;">${carrier?.company_name || '—'}<br><span style="font-size:11px;color:#64748b;">${carrier?.bank_account_name || '—'} · ${carrier?.sort_code || '—'} · ${carrier?.account_number || '—'}</span></td>
                <td style="padding:8px 0;font-weight:700;color:#059669;">£${(j.partner_rate ?? 0).toLocaleString()}</td>
                <td style="padding:8px 0;font-weight:700;color:${daysLeft <= 1 ? '#dc2626' : '#f59e0b'};">${daysLeft <= 0 ? 'TODAY' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <p style="margin-top:20px;font-size:13px;color:#64748b;">Transfer using banking details shown. The payment-release cron will auto-confirm each release at 07:00 UTC on the due date.</p>
      </div>
    `,
    text: `Partner payments due within 3 days — £${totalDue.toLocaleString()} total\n\n${upcoming.map(j => {
      const carrier = (j as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
      return `${j.reference}: £${(j.partner_rate ?? 0).toLocaleString()} to ${carrier?.company_name || '—'} (due ${new Date(j.payment_due_at as string).toLocaleDateString('en-GB')})`;
    }).join('\n')}`,
  });

  return NextResponse.json({ ok: true, upcoming: upcoming.length, total_due: totalDue });
}
