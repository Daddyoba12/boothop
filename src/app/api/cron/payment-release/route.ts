import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called daily at 07:00 UTC.
// Finds delivered jobs where 7 days have elapsed since delivery — marks payment released
// and notifies the carrier.

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find delivered jobs due for payment that haven't been released yet
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      carrier_profiles!partner_id (
        email, contact_name, company_name,
        bank_account_name, sort_code, account_number
      )
    `)
    .eq('status', 'delivered')
    .is('payment_released_at', null)
    .lte('delivered_at', sevenDaysAgo);

  if (error) {
    console.error('payment-release: fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ ok: true, released: 0 });
  }

  let released = 0;

  for (const job of jobs) {
    const partner = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
    if (!partner) continue;

    // Mark payment released
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({ payment_released_at: new Date().toISOString() })
      .eq('id', job.id);

    if (updateErr) {
      console.error(`payment-release: update error for ${job.reference}`, updateErr);
      continue;
    }

    // Carrier payment notification
    if (partner.email) {
      await sendResendEmail({
        from,
        to: partner.email,
        subject: `💷 Payment released — ${job.reference} · £${job.partner_rate?.toLocaleString() ?? '—'}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
            <div style="margin-bottom:20px;">
              <span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span>
            </div>
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;">Payment released.</h2>
            <p style="margin:0 0 24px;color:#64748b;">Your earnings for job <strong>${job.reference}</strong> have been released and are on their way to your account.</p>
            <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;color:#16a34a;letter-spacing:.05em;">Amount transferred</p>
              <p style="margin:0;font-size:36px;font-weight:900;color:#15803d;">£${job.partner_rate?.toLocaleString() ?? '—'}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:140px;">Job reference</td><td style="padding:8px 0;font-weight:700;">${job.reference}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Destination account</td><td style="padding:8px 0;">${partner.bank_account_name || '—'} · ${partner.sort_code || '—'} · ${partner.account_number || '—'}</td></tr>
              <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Delivered</td><td style="padding:8px 0;">${job.delivered_at ? new Date(job.delivered_at as string).toLocaleDateString('en-GB') : '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Released</td><td style="padding:8px 0;font-weight:600;">${new Date().toLocaleDateString('en-GB')}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b;">Transfers typically clear within 1–2 working days. Questions? Contact <a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a> or call <strong>+44 115 661 2825</strong>.</p>
          </div>
        `,
        text: `Payment released for ${job.reference}.\nAmount: £${job.partner_rate?.toLocaleString() ?? '—'}\nAccount: ${partner.bank_account_name || '—'}\nDelivered: ${job.delivered_at}\nReleased: ${new Date().toLocaleDateString('en-GB')}\n\nQuestions: business@boothop.com / +44 115 661 2825`,
      });
    }

    // Admin record
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `💷 Payment released — ${job.reference} · £${job.partner_rate?.toLocaleString() ?? '—'} to ${partner.company_name || partner.email}`,
      text: `Payment released for ${job.reference}.\nPartner: ${partner.company_name || partner.email}\nAmount: £${job.partner_rate?.toLocaleString() ?? '—'}\nAccount: ${partner.bank_account_name || '—'} · SC ${partner.sort_code || '—'} · AC ${partner.account_number || '—'}`,
    });

    released++;
  }

  return NextResponse.json({ ok: true, released });
}
