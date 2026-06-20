import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Daily at 08:00 UTC.
// Auto-confirms delivered jobs as complete if 48 hours have passed with no dispute raised.
// Sets payment_due_at so the payment-release cron can fire 7 days later.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const hrs48 = new Date(Date.now() - 48 * 3600000).toISOString();

  // Jobs delivered 48+ hours ago, payment_due_at not yet set
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, reference, client_email, partner_rate, delivered_at')
    .eq('status', 'delivered')
    .is('payment_due_at', null)
    .is('payment_released_at', null)
    .lte('delivered_at', hrs48);

  for (const job of jobs ?? []) {
    const paymentDueAt = new Date(Date.now() + 7 * 86400000).toISOString();

    await supabase.from('jobs').update({ payment_due_at: paymentDueAt }).eq('id', job.id);

    // Notify client delivery is confirmed
    await sendResendEmail({
      from,
      to: job.client_email,
      subject: `✅ Delivery confirmed — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Delivery confirmed.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Your delivery for booking <strong>${job.reference}</strong> has been confirmed as complete.</p>
          <p style="font-size:14px;margin:0 0 16px;">Thank you for using BootHop. If you need another delivery, visit <a href="https://boothop.com/business/express" style="color:#059669;">boothop.com/business</a>.</p>
          <p style="font-size:13px;color:#64748b;">Any issues? Contact us within 24 hours: <strong>+44 115 661 2825</strong> · <a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a></p>
        </div>
      `,
      text: `Delivery confirmed for ${job.reference}.\n\nThank you for using BootHop. Book again at boothop.com/business.\n\nIssues? +44 115 661 2825 / business@boothop.com`,
    });
  }

  if (jobs && jobs.length > 0) {
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `✅ ${jobs.length} job${jobs.length !== 1 ? 's' : ''} auto-confirmed — payment clocks started`,
      text: `${jobs.length} job(s) auto-confirmed after 48-hour dispute window:\n${jobs.map(j => `- ${j.reference} (delivered: ${j.delivered_at})`).join('\n')}\n\nPayment release will trigger in 7 days.`,
    });
  }

  return NextResponse.json({ ok: true, confirmed: jobs?.length ?? 0 });
}
