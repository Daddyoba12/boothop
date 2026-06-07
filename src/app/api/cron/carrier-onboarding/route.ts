import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 09:00 UTC.
// Sends the 3-email carrier onboarding sequence triggered by verification events:
//   Email 2: Companies House verified → one step left (upload insurance)
//   Email 3: Profile now active — job matching switched on
//   Email 4: 7-day follow-up if no jobs accepted yet

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const days7 = new Date(Date.now() - 7 * 86400000).toISOString();

  // ── Email 2: CH verified, not yet active ──────────────────────────────
  // Carriers that were verified in last 24h but are still payment_pending (waiting insurance/activation)
  const { data: chVerified } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, company_reg_number, co_house_checked_at, insurance_filename')
    .eq('co_house_verified', true)
    .eq('status', 'payment_pending')
    .not('co_house_checked_at', 'is', null)
    .gte('co_house_checked_at', new Date(Date.now() - 24 * 3600000).toISOString());

  for (const c of chVerified ?? []) {
    await resend.emails.send({
      from,
      to: c.email,
      subject: `✅ Companies House verified — one step left · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span> <span style="font-size:12px;color:#64748b;">Carrier Network</span></div>
          <div style="background:#f0fdf4;border-radius:12px;padding:14px 20px;margin-bottom:20px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#16a34a;">✅ Companies House verified — <span style="font-family:monospace;">${c.company_reg_number}</span></p>
          </div>
          <h2 style="font-size:20px;margin:0 0 8px;">One step left, ${c.contact_name || c.company_name}.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 20px;">Your company is verified. Here's what's still needed to activate your profile:</p>
          ${!c.insurance_filename ? `
          <div style="border:2px solid #f59e0b;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-weight:700;font-size:14px;">Insurance certificate</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 12px;">Email your current insurance certificate to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a> with subject line:</p>
            <p style="font-family:monospace;font-weight:700;font-size:14px;background:#f8fafc;padding:8px 12px;border-radius:6px;margin:0;">INSURANCE - ${c.company_name}</p>
          </div>` : ''}
          <div style="border:2px solid #f59e0b;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-weight:700;font-size:14px;">£250 registration fee</p>
            <p style="font-size:13px;color:#64748b;margin:0 0 12px;">If you haven't yet, please transfer your £250 registration fee:</p>
            <table style="font-size:13px;"><tr><td style="color:#64748b;padding:2px 10px 2px 0;">Account</td><td style="font-weight:700;">BootHop Ltd · 23-08-01 · 44947453</td></tr></table>
          </div>
          <p style="font-size:14px;">Once both are confirmed, your profile will be activated within 2 working days and job alerts will begin.</p>
          <p style="font-size:13px;color:#64748b;margin-top:16px;">Questions: +44 115 661 2825 · <a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
        </div>
      `,
      text: `Companies House verified for ${c.company_name}!\n\nRemaining steps:\n${!c.insurance_filename ? '1. Email insurance certificate to carriers@boothop.com (subject: INSURANCE - ' + c.company_name + ')\n' : ''}2. Transfer £250 to BootHop Ltd · Sort: 23-08-01 · AC: 44947453\n\nProfile activated within 2 working days once both confirmed.\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });
  }

  // ── Email 3: Profile just activated (status changed to active in last 24h) ──
  const { data: newlyActive } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, base_location, vehicle_types')
    .eq('status', 'active')
    .eq('status_active', true)
    .gte('updated_at', new Date(Date.now() - 24 * 3600000).toISOString());

  for (const c of newlyActive ?? []) {
    const vehicleList = Array.isArray(c.vehicle_types) ? (c.vehicle_types as string[]).join(', ') : '—';
    await resend.emails.send({
      from,
      to: c.email,
      subject: `🚀 You're live — job alerts have started · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span> <span style="font-size:12px;color:#64748b;">Carrier Network</span></div>
          <h2 style="font-size:22px;margin:0 0 8px;">Welcome to BootHop, ${c.contact_name || c.company_name}. You're live.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 20px;">Your profile is now active and job alerts have started for your coverage area.</p>
          <div style="background:#eff6ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;font-size:13px;">
            <p style="margin:0 0 8px;font-weight:700;">Your profile summary</p>
            <p style="margin:0 0 4px;">Base: <strong>${c.base_location || '—'}</strong></p>
            <p style="margin:0;">Vehicles: <strong>${vehicleList}</strong></p>
          </div>
          <p style="font-size:14px;font-weight:700;margin:0 0 12px;">How it works:</p>
          <div style="border-left:3px solid #2563eb;padding-left:16px;margin-bottom:20px;">
            <p style="font-size:13px;margin:0 0 10px;">1. You receive a job alert email when a booking matches your area and vehicle type</p>
            <p style="font-size:13px;margin:0 0 10px;">2. Click <strong>Accept this job</strong> — first to accept wins</p>
            <p style="font-size:13px;margin:0 0 10px;">3. Full pickup and delivery address revealed immediately</p>
            <p style="font-size:13px;margin:0 0 10px;">4. Update status via email links: Collected → In transit → Delivered</p>
            <p style="font-size:13px;margin:0;">5. Payment (70% of the posted rate) is transferred within 1 week of confirmed delivery</p>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:20px;">
            <strong>Earnings model:</strong> BootHop posts jobs at 70% of the client rate. You receive that 70% — paid within 1 week of delivery. No bidding. First to accept wins.
          </div>
          <p style="font-size:13px;color:#64748b;">Questions: +44 115 661 2825 · <a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
        </div>
      `,
      text: `You're live on BootHop!\n\nJob alerts have started for ${c.base_location || 'your area'}.\n\nHow it works:\n1. Get job alert email\n2. Click Accept — first wins\n3. Collect → Update status → Deliver\n4. Earn 70% of posted rate, paid within 1 week\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });
  }

  // ── Email 4: 7-day follow-up, no jobs accepted ─────────────────────────
  const { data: sevenDayFollowUp } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, base_location, last_job_at')
    .eq('status', 'active')
    .eq('status_active', true)
    .is('last_job_at', null)
    .lte('updated_at', days7)
    .gte('updated_at', new Date(Date.now() - 8 * 86400000).toISOString());

  for (const c of sevenDayFollowUp ?? []) {
    await resend.emails.send({
      from,
      to: c.email,
      subject: `How's it going? — ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">One week in — any questions?</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Hi ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your BootHop profile has been live for one week. We noticed you haven't accepted a job yet — we just want to make sure everything is working as expected.</p>
          <p style="font-size:14px;margin:0 0 16px;">Job alerts go to <strong>${c.email}</strong> for deliveries near <strong>${c.base_location || 'your base'}</strong>. If you're not seeing alerts, check your spam folder or contact us and we'll investigate.</p>
          <p style="font-size:14px;">We're here if you need anything:</p>
          <p style="font-size:15px;font-weight:700;margin:4px 0;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#2563eb;margin:4px 0;"><a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
        </div>
      `,
      text: `One week in — ${c.company_name}.\n\nYou haven't accepted a job yet. Job alerts go to ${c.email} for deliveries near ${c.base_location || 'your base'}.\n\nCheck spam, or contact us if you're not receiving alerts.\n\n+44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({
    ok: true,
    email2_ch_verified: chVerified?.length ?? 0,
    email3_newly_active: newlyActive?.length ?? 0,
    email4_seven_day: sevenDayFollowUp?.length ?? 0,
  });
}
