import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called daily at 09:00 UTC.
// Sends renewal reminders to Priority Partners approaching membership expiry:
//   60 days before expiry → first reminder
//   14 days before expiry → final reminder

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now   = new Date();
  const in14  = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const in60  = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);

  // ── Final reminder: 14 days ────────────────────────────────────────────
  const { data: due14 } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, annual_fee, delivery_type, membership_expires_at')
    .eq('status', 'active')
    .gte('membership_expires_at', `${in14}T00:00:00Z`)
    .lt('membership_expires_at', `${in14}T23:59:59Z`);

  for (const p of due14 ?? []) {
    const expiry = p.membership_expires_at
      ? new Date(p.membership_expires_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'soon';

    await sendResendEmail({
      from,
      to: p.email,
      subject: `⚠️ Priority membership expires in 14 days — action required · ${p.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <h2 style="color:#dc2626;margin:0 0 8px;font-size:20px;">Final renewal reminder — 14 days</h2>
          <p style="font-size:14px;margin:0 0 16px;">Dear ${p.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your Priority Partner membership expires on <strong>${expiry}</strong>. To continue receiving priority job matching, 2-hour response SLA, and 5% membership discounts, please renew before this date.</p>
          <p style="font-size:14px;margin:0 0 20px;">Renewal fee: <strong>£${(p.annual_fee ?? 0).toLocaleString()}/year</strong></p>
          <table style="font-size:13px;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account name</td><td style="font-weight:700;">BootHop Ltd</td></tr>
            <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Sort code</td><td style="font-weight:700;">23-08-01</td></tr>
            <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account number</td><td style="font-weight:700;">44947453</td></tr>
            <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Reference</td><td style="font-weight:900;color:#d97706;font-family:monospace;">PP-${(p.company_name || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)}-RENEW</td></tr>
            <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Amount</td><td style="font-weight:900;font-size:16px;">£${(p.annual_fee ?? 0).toLocaleString()}</td></tr>
          </table>
          <p style="font-size:13px;color:#64748b;">Questions: +44 115 661 2825 · business@boothop.com</p>
        </div>
      `,
      text: `Priority membership expires in 14 days.\n\nRenew now: £${(p.annual_fee ?? 0).toLocaleString()}\nAccount: BootHop Ltd | Sort: 23-08-01 | AC: 44947453\nReference: PP-${(p.company_name || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)}-RENEW\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });

    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `⚠️ Priority renewal due in 14 days — ${p.company_name}`,
      text: `${p.company_name} (${p.email}): Priority membership expires ${expiry}. Annual fee: £${(p.annual_fee ?? 0).toLocaleString()}.`,
    });
  }

  // ── First reminder: 60 days ────────────────────────────────────────────
  const { data: due60 } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, annual_fee, membership_expires_at')
    .eq('status', 'active')
    .gte('membership_expires_at', `${in60}T00:00:00Z`)
    .lt('membership_expires_at', `${in60}T23:59:59Z`);

  for (const p of due60 ?? []) {
    const expiry = p.membership_expires_at
      ? new Date(p.membership_expires_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'in 60 days';

    await sendResendEmail({
      from,
      to: p.email,
      subject: `📋 Priority membership renewal — 60 day notice · ${p.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;">Membership renewal — 60 day notice</h2>
          <p style="font-size:14px;margin:0 0 16px;">Dear ${p.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your Priority Partner membership is set to expire on <strong>${expiry}</strong>. We will send another reminder 14 days before expiry, but you can renew at any time by contacting your account manager.</p>
          <p style="font-size:14px;">Renewal fee: <strong>£${(p.annual_fee ?? 0).toLocaleString()}/year</strong></p>
          <p style="font-size:13px;color:#64748b;margin-top:16px;">+44 115 661 2825 · business@boothop.com</p>
        </div>
      `,
      text: `Priority membership renewal notice (60 days).\nExpiry: ${expiry}\nRenewal fee: £${(p.annual_fee ?? 0).toLocaleString()}/year\n\nContact your account manager to renew: +44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({
    ok: true,
    reminded_14_days: due14?.length ?? 0,
    reminded_60_days: due60?.length ?? 0,
  });
}
