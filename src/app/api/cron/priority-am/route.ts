import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Called every 30 minutes by Vercel Cron.
// Monitors Priority Partner applications awaiting account manager contact:
//   +90 min: nudge to remind AM to call
//   +2 hours: escalation if still no call logged

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now       = Date.now();
  const mins90ago = new Date(now - 90 * 60 * 1000).toISOString();
  const hrs2ago   = new Date(now - 2 * 60 * 60 * 1000).toISOString();

  // Priority partners: application > 2 hours old, no AM call logged → escalation
  const { data: escalate } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, job_title, industry_sector, delivery_type, annual_fee, am_called_at, created_at')
    .eq('status', 'payment_pending')
    .is('am_called_at', null)
    .lte('created_at', hrs2ago);

  for (const p of escalate ?? []) {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `🚨 ESCALATION — Priority Partner application > 2hrs, no AM call · ${p.company_name || p.email}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:24px;color:#0f172a;">
          <h2 style="color:#dc2626;margin:0 0 12px;">Account manager call overdue — 2 hour SLA breached</h2>
          <table style="font-size:14px;border-collapse:collapse;width:100%;margin-bottom:16px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:160px;">Company</td><td style="padding:8px 0;font-weight:700;">${p.company_name || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${p.email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;font-weight:700;color:#dc2626;">${p.phone || '⚠ Not provided'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Job title</td><td style="padding:8px 0;">${p.job_title || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Industry</td><td style="padding:8px 0;">${p.industry_sector || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Account type</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${p.delivery_type === 'international' ? 'International' : 'UK'} Partner — £${(p.annual_fee ?? 0).toLocaleString()}/yr</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Applied</td><td style="padding:8px 0;">${new Date(p.created_at as string).toLocaleTimeString('en-GB')}</td></tr>
          </table>
          <div style="background:#fee2e2;border-radius:8px;padding:12px 16px;">
            <strong>Action required now:</strong> Call ${p.phone || p.email} immediately. Log the call in the admin portal when complete.
          </div>
        </div>
      `,
      text: `ESCALATION: Priority Partner AM call overdue\n\n${p.company_name || p.email}\nPhone: ${p.phone || 'Not provided'}\nApplied at: ${new Date(p.created_at as string).toLocaleTimeString('en-GB')}\n\nCall immediately — 2-hour SLA has been breached.`,
    });
  }

  // Priority partners: application 90+ min old, no AM call logged → nudge
  const { data: nudge } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, job_title, annual_fee, created_at')
    .eq('status', 'payment_pending')
    .is('am_called_at', null)
    .lte('created_at', mins90ago)
    .gt('created_at', hrs2ago);  // Between 90 min and 2 hrs old (older ones escalate above)

  for (const p of nudge ?? []) {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⏰ Priority Partner reminder — call ${p.company_name || p.email} in 30 minutes`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:24px;color:#0f172a;">
          <h3 style="color:#f59e0b;margin:0 0 12px;">AM call reminder — 30 minutes until SLA breach</h3>
          <p style="font-size:14px;"><strong>${p.company_name || p.email}</strong> applied 90 minutes ago for a Priority Partnership (£${(p.annual_fee ?? 0).toLocaleString()}/yr).</p>
          <p style="font-size:14px;">Phone: <strong>${p.phone || '⚠ Not provided — contact by email'}</strong></p>
          <p style="font-size:13px;color:#64748b;">Applied at: ${new Date(p.created_at as string).toLocaleTimeString('en-GB')}<br>2-hour SLA breach: ${new Date((p.created_at as string ? new Date(p.created_at as string).getTime() : Date.now()) + 2 * 60 * 60 * 1000).toLocaleTimeString('en-GB')}</p>
        </div>
      `,
      text: `Reminder: Call ${p.company_name || p.email} (${p.phone || 'no phone — email'}) for Priority Partner onboarding. 30 minutes until 2-hour SLA breach.`,
    });
  }

  return NextResponse.json({
    ok: true,
    escalated: escalate?.length ?? 0,
    nudged:    nudge?.length ?? 0,
  });
}
