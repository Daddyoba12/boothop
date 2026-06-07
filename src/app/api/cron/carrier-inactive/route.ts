import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Called daily at 10:00 UTC.
// Checks for inactive carriers:
//   Day 14 with no job accepted → nudge email
//   Day 90 with no job accepted → flag for review in admin

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now = Date.now();
  const day14ago = new Date(now - 14 * 86400000).toISOString();
  const day90ago = new Date(now - 90 * 86400000).toISOString();

  // Active carriers with no jobs at all or no job since 90 days → flag for review
  const { data: stale90 } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, created_at, last_job_at')
    .eq('status', 'active')
    .eq('status_active', true)
    .or(`last_job_at.is.null,last_job_at.lte.${day90ago}`)
    .lte('created_at', day90ago);  // Profile is at least 90 days old

  for (const c of stale90 ?? []) {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `🔍 Carrier inactive 90+ days — review required · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h3>Carrier inactive for 90+ days</h3>
          <p><strong>${c.company_name}</strong> (${c.email})<br>
          Profile created: ${new Date(c.created_at as string).toLocaleDateString('en-GB')}<br>
          Last job: ${c.last_job_at ? new Date(c.last_job_at as string).toLocaleDateString('en-GB') : 'Never'}</p>
          <p>Consider: calling to check vehicle availability, reviewing coverage area, or deactivating if unreachable.</p>
        </div>
      `,
      text: `${c.company_name} (${c.email}) has been inactive for 90+ days.\nLast job: ${c.last_job_at ? new Date(c.last_job_at as string).toLocaleDateString('en-GB') : 'Never'}\nProfile created: ${new Date(c.created_at as string).toLocaleDateString('en-GB')}`,
    });
  }

  // Active carriers with no jobs since 14 days → nudge email to carrier
  const { data: stale14 } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, last_job_at, base_location')
    .eq('status', 'active')
    .eq('status_active', true)
    .or(`last_job_at.is.null,last_job_at.lte.${day14ago}`)
    .gt('created_at', day90ago);  // Profile is between 14 and 90 days old (older ones go to 90-day)

  for (const c of stale14 ?? []) {
    await resend.emails.send({
      from,
      to: c.email,
      subject: `How are things going, ${c.contact_name || c.company_name}?`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;">Checking in.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Hi ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">We noticed you haven't accepted a job through BootHop recently. We want to make sure everything is working well for you.</p>
          <p style="font-size:14px;margin:0 0 16px;">Job alerts are sent to <strong>${c.email}</strong> for deliveries in your area — <strong>${c.base_location || 'your registered base'}</strong>. If you're not seeing alerts or your availability has changed, let us know and we can adjust your profile.</p>
          <p style="font-size:14px;margin:0 0 20px;">Is everything okay? Reply to this email or call us:</p>
          <p style="font-size:15px;font-weight:700;margin:0;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#2563eb;margin:4px 0;"><a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
        </div>
      `,
      text: `Hi ${c.contact_name || c.company_name},\n\nWe noticed you haven't accepted a job recently. Job alerts are sent to ${c.email} for deliveries near ${c.base_location || 'your registered base'}.\n\nIf anything has changed or you're not receiving alerts, please let us know.\n\n+44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({
    ok: true,
    flagged_90_days: stale90?.length ?? 0,
    nudged_14_days:  stale14?.length ?? 0,
  });
}
