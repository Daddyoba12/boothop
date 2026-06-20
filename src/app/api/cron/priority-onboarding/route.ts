import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Daily at 10:00 UTC.
// Sends Priority Partner onboarding sequence after account activation:
//   Day 1: Welcome + checklist
//   Week 1: First week check-in
//   Month 1: Month 1 review + tips

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const now    = Date.now();
  const day1   = new Date(now - 1  * 86400000).toISOString();
  const day7   = new Date(now - 7  * 86400000).toISOString();
  const day30  = new Date(now - 30 * 86400000).toISOString();

  // Day 1 welcome: activated in last 24 hours
  const { data: newActive } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, annual_fee, delivery_type, discount_pct, response_hours, am_assigned')
    .eq('status', 'active')
    .gte('updated_at', day1);

  for (const p of newActive ?? []) {
    await sendResendEmail({
      from,
      to: p.email,
      subject: `Welcome to BootHop Priority — your account is live · ${p.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <div style="background:#fef3c7;border-radius:12px;padding:14px 20px;margin-bottom:24px;">
            <p style="margin:0;font-weight:700;font-size:14px;color:#92400e;">✅ Your Priority Partner account is now active.</p>
          </div>
          <h2 style="font-size:22px;margin:0 0 8px;">Welcome to Priority, ${p.company_name}.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px;">Here's your quick-start guide to getting the most from your membership.</p>

          <div style="border-left:3px solid #f59e0b;padding-left:16px;margin-bottom:24px;">
            <p style="font-size:14px;font-weight:700;margin:0 0 4px;">2-hour response SLA</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 16px;">Every booking you make will receive a carrier confirmation or direct response within 2 hours — guaranteed.</p>
            <p style="font-size:14px;font-weight:700;margin:0 0 4px;">${p.discount_pct ?? 5}% membership discount</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 16px;">Applied automatically to all bookings.</p>
            <p style="font-size:14px;font-weight:700;margin:0 0 4px;">Dedicated account manager</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 16px;">${p.am_assigned ? `Your AM is <strong>${p.am_assigned}</strong>.` : 'Your account manager will introduce themselves by email today.'} Use them for urgent bookings, special cargo, or any questions.</p>
            <p style="font-size:14px;font-weight:700;margin:0 0 4px;">Monthly delivery report</p>
            <p style="font-size:13px;color:#64748b;margin:0;">You'll receive a detailed delivery report and invoice on the 1st of each month.</p>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:13px;">
            <strong>Make your first Priority booking:</strong><br>
            Call <strong>+44 115 661 2825</strong> or email <a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a> and quote your account name <strong>${p.company_name}</strong>. Your Priority status is applied immediately.
          </div>

          <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">
            ${p.delivery_type === 'international' ? 'International' : 'UK'} Priority Partner · £${(p.annual_fee ?? 0).toLocaleString()}/yr · ${p.discount_pct ?? 5}% discount · ${p.response_hours ?? 2}-hour SLA
          </p>
        </div>
      `,
      text: `Welcome to BootHop Priority!\n\nYour account for ${p.company_name} is now active.\n\nYour benefits:\n- ${p.response_hours ?? 2}-hour response SLA\n- ${p.discount_pct ?? 5}% discount on all bookings\n- Dedicated account manager\n- Monthly delivery report\n\nFirst booking: call +44 115 661 2825 or email business@boothop.com, quote ${p.company_name}.`,
    });
  }

  // Week 1 check-in
  const { data: week1 } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, am_assigned')
    .eq('status', 'active')
    .lte('updated_at', day7)
    .gt('updated_at', new Date(now - 8 * 86400000).toISOString());

  for (const p of week1 ?? []) {
    await sendResendEmail({
      from,
      to: p.email,
      subject: `One week in — how can we help? · ${p.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">One week in — how are things?</h2>
          <p style="font-size:14px;margin:0 0 16px;">Hi ${p.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your Priority Partner account has been live for a week. We're here to make sure you're getting the most from your membership.</p>
          <p style="font-size:14px;margin:0 0 16px;">Have any questions? Need help with an urgent booking? Just reply to this email or call us directly:</p>
          <p style="font-size:15px;font-weight:700;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#d97706;"><a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a></p>
        </div>
      `,
      text: `One week in — ${p.company_name}.\n\nHow are things going? We're here for any questions or urgent bookings.\n\n+44 115 661 2825 / business@boothop.com`,
    });
  }

  // Month 1 review
  const { data: month1 } = await supabase
    .from('priority_partners')
    .select('id, email, company_name')
    .eq('status', 'active')
    .lte('updated_at', day30)
    .gt('updated_at', new Date(now - 31 * 86400000).toISOString());

  for (const p of month1 ?? []) {
    await sendResendEmail({
      from,
      to: p.email,
      subject: `Your first month with BootHop Priority · ${p.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">One month with Priority.</h2>
          <p style="font-size:14px;margin:0 0 16px;">Hi ${p.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">It's been a month since your Priority Partner account went live. Your first monthly delivery report and invoice will arrive on the 1st of next month.</p>
          <p style="font-size:14px;margin:0 0 16px;">If you'd like to discuss your account, expand to international deliveries, or have any feedback, your account manager is always available:</p>
          <p style="font-size:15px;font-weight:700;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#d97706;"><a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a></p>
        </div>
      `,
      text: `One month with BootHop Priority — ${p.company_name}.\n\nYour first monthly report arrives on the 1st of next month.\n\nAccount manager: +44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({
    ok: true,
    day1: newActive?.length ?? 0,
    week1: week1?.length ?? 0,
    month1: month1?.length ?? 0,
  });
}
