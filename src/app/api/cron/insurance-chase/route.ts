import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 10:00 UTC.
// Chases carriers who haven't uploaded an insurance certificate.
// Sends nudge at day 3 and day 7 after application. Flags admin at day 14.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now    = Date.now();
  const day3   = new Date(now - 3  * 86400000).toISOString();
  const day7   = new Date(now - 7  * 86400000).toISOString();
  const day14  = new Date(now - 14 * 86400000).toISOString();

  const base = supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, created_at')
    .or('insurance_filename.is.null,insurance_filename.eq.')
    .in('status', ['payment_pending', 'active']);

  // Day 14 — escalate to admin
  const { data: stale } = await base.lte('created_at', day14);
  if (stale && stale.length > 0) {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⚠️ ${stale.length} carrier${stale.length !== 1 ? 's' : ''} still missing insurance certificate (14+ days)`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h3>Insurance certificate overdue (14+ days)</h3><ul style="font-size:14px;">${stale.map(c => `<li><strong>${c.company_name}</strong> — ${c.email} (applied ${new Date(c.created_at as string).toLocaleDateString('en-GB')})</li>`).join('')}</ul><p style="font-size:13px;color:#64748b;">Consider calling directly or deactivating these profiles.</p></div>`,
      text: `${stale.length} carriers missing insurance (14+ days):\n${stale.map(c => `- ${c.company_name}: ${c.email}`).join('\n')}`,
    });
  }

  // Day 7 — firm reminder to carrier
  const { data: week } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name')
    .or('insurance_filename.is.null,insurance_filename.eq.')
    .in('status', ['payment_pending', 'active'])
    .lte('created_at', day7)
    .gt('created_at', day14);

  for (const c of week ?? []) {
    await resend.emails.send({
      from,
      to: c.email,
      subject: `⚠️ Insurance certificate still needed — ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;color:#dc2626;">Insurance certificate required</h2>
          <p style="font-size:14px;margin:0 0 16px;">Hi ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your carrier profile cannot be activated until we receive a valid insurance certificate. This has been outstanding for 7 days.</p>
          <p style="font-size:14px;margin:0 0 16px;">Please email your certificate to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a> with subject line:</p>
          <p style="font-family:monospace;font-weight:700;font-size:14px;background:#f8fafc;padding:10px;border-radius:6px;">INSURANCE - ${c.company_name}</p>
          <p style="margin-top:16px;font-size:13px;color:#64748b;">Questions: +44 115 661 2825</p>
        </div>
      `,
      text: `Insurance certificate still needed for ${c.company_name}.\n\nEmail to: carriers@boothop.com\nSubject: INSURANCE - ${c.company_name}\n\nYour profile cannot be activated until received.\n\nQuestions: +44 115 661 2825`,
    });
  }

  // Day 3 — first nudge
  const { data: day3carriers } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name')
    .or('insurance_filename.is.null,insurance_filename.eq.')
    .in('status', ['payment_pending', 'active'])
    .lte('created_at', day3)
    .gt('created_at', day7);

  for (const c of day3carriers ?? []) {
    await resend.emails.send({
      from,
      to: c.email,
      subject: `Reminder — insurance certificate needed · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
          <p style="font-size:14px;margin:0 0 16px;">Hi ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">We're still waiting for your insurance certificate to complete your carrier profile. Please email it to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a> with the subject <strong>INSURANCE - ${c.company_name}</strong>.</p>
          <p style="font-size:14px;">Once received, your profile will be activated and job alerts will begin.</p>
          <p style="font-size:13px;color:#64748b;margin-top:16px;">Questions: +44 115 661 2825</p>
        </div>
      `,
      text: `Reminder: email your insurance certificate to carriers@boothop.com (subject: INSURANCE - ${c.company_name}).\n\nOnce received, your profile will be activated.\n\nQuestions: +44 115 661 2825`,
    });
  }

  return NextResponse.json({
    ok: true,
    escalated_14_days: stale?.length ?? 0,
    chased_7_days: week?.length ?? 0,
    nudged_3_days: day3carriers?.length ?? 0,
  });
}
