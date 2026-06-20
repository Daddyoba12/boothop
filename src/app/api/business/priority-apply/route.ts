import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

const FEES: Record<string, number> = {
  uk:            10000,
  international: 15000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, company_name, phone,
      job_title, industry_sector,
      delivery_type,
      delivery_frequency, typical_destinations,
      what_moving,
      notes,
    } = body;

    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });
    if (!delivery_type) return NextResponse.json({ error: 'Delivery type (UK or International) required.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    // One-role-per-domain: check if this domain is already registered as a carrier
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const { data: existingCarrier } = await supabase
        .from('carrier_profiles')
        .select('email')
        .ilike('email', `%@${domain}`)
        .gte('created_at', sixMonthsAgo)
        .limit(1);
      if (existingCarrier && existingCarrier.length > 0) {
        return NextResponse.json({
          error: `A company from ${domain} is already registered as a Carrier Partner. One organisation can only hold one BootHop role within a 6-month period.`,
        }, { status: 409 });
      }
    }

    const fee = FEES[delivery_type] ?? FEES.uk;

    const { error } = await supabase.from('priority_partners').upsert({
      email,
      company_name:         company_name         || null,
      phone:                phone                || null,
      job_title:            job_title            || null,
      industry_sector:      industry_sector      || null,
      delivery_type:        delivery_type,
      delivery_volume:      delivery_type,  // kept for backward-compat
      delivery_frequency:   delivery_frequency   || null,
      typical_destinations: typical_destinations || null,
      what_moving:          Array.isArray(what_moving) ? what_moving : [],
      notes:                notes                || null,
      annual_fee:           fee,
      discount_pct:         5,
      response_hours:       2,
      status:               'payment_pending',
    }, { onConflict: 'email' });

    if (error) throw error;

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
    const typeLabel  = delivery_type === 'international'
      ? `International Partner (£${FEES.international.toLocaleString()}/yr)`
      : `UK Partner (£${FEES.uk.toLocaleString()}/yr)`;

    const whatList = Array.isArray(what_moving) && what_moving.length > 0
      ? what_moving.join(', ')
      : '—';

    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `⭐ Priority Partner Application — ${company_name || email} (${typeLabel})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:22px;font-weight:900;color:#f59e0b;">Hop Business</span>
          </div>
          <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">Priority Partner Application</span>
          <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">New priority partner — awaiting payment</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:180px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Company</td><td style="padding:8px 0;font-weight:600;">${company_name || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${phone || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Job title</td><td style="padding:8px 0;">${job_title || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Industry</td><td style="padding:8px 0;">${industry_sector || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Account type</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${typeLabel}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Delivery frequency</td><td style="padding:8px 0;">${delivery_frequency || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Destinations</td><td style="padding:8px 0;">${typical_destinations || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">What they move</td><td style="padding:8px 0;">${whatList}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
          </table>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;">
            <strong>Action:</strong> Awaiting bank transfer of <strong>£${fee.toLocaleString()}</strong>.<br>
            Once payment clears, set status → <strong>active</strong> in Supabase (priority_partners table).<br>
            Account activation: <strong>within 1 week of payment clearing</strong>.
          </div>
        </div>
      `,
      text: `Priority Partner Application\n\n${company_name || ''} (${email})\nPhone: ${phone || '—'}\nJob Title: ${job_title || '—'}\nIndustry: ${industry_sector || '—'}\nType: ${typeLabel}\nFrequency: ${delivery_frequency || '—'}\nDestinations: ${typical_destinations || '—'}\nMoving: ${whatList}\nNotes: ${notes || '—'}\n\nAwaiting £${fee.toLocaleString()} bank transfer. Activate within 1 week of payment.`,
    });

    // ── Applicant confirmation email ─────────────────────────────────────
    await sendResendEmail({
      from,
      to: email,
      subject: `Your Priority Partner application — what happens next`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:22px;font-weight:900;color:#f59e0b;">Hop</span>
            <span style="font-size:13px;color:#64748b;margin-left:8px;">Priority Partner</span>
          </div>

          <!-- AM call banner -->
          <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#92400e;">What happens first</p>
            <p style="margin:8px 0 0;font-size:20px;font-weight:900;color:#78350f;">YOUR ACCOUNT MANAGER WILL CALL YOU WITHIN 2 HOURS</p>
            <p style="margin:8px 0 0;font-size:13px;color:#92400e;">We will walk you through onboarding and answer any questions.</p>
          </div>

          <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;">Application received, ${company_name || email}.</h2>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
            Your Priority Partner application has been received. Here is the full onboarding timeline.
          </p>

          <!-- Timeline -->
          <div style="border-left:3px solid #f59e0b;padding-left:20px;margin-bottom:28px;">
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">1. Account manager call — within 2 hours</p>
              <p style="margin:0;font-size:13px;color:#64748b;">Your dedicated account manager will call <strong>${phone || 'you'}</strong> to confirm your requirements and answer questions.</p>
            </div>
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">2. Transfer your annual membership fee</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Use the bank details below. Your annual fee is <strong>£${fee.toLocaleString()}</strong>.</p>
              <table style="font-size:13px;border-collapse:collapse;">
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account name</td><td style="font-weight:700;">BootHop Ltd</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Sort code</td><td style="font-weight:700;">23-08-01</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account number</td><td style="font-weight:700;">44947453</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Reference</td><td style="font-weight:900;color:#d97706;font-family:monospace;">PP-${(company_name || '').replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6)||'BHOOD'}-${new Date().getFullYear()}</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Amount</td><td style="font-weight:900;font-size:16px;">£${fee.toLocaleString()}</td></tr>
              </table>
            </div>
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">3. Account activation — within 1 week of payment clearing</p>
              <p style="margin:0;font-size:13px;color:#64748b;">Once your transfer clears, your Priority Partner account is activated and all deliveries are flagged as priority.</p>
            </div>
            <div>
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">4. Priority benefits begin immediately</p>
              <p style="margin:0;font-size:13px;color:#64748b;">2-hour response SLA · Dedicated account manager · 5% discount on all bookings · Monthly delivery report &amp; invoice</p>
            </div>
          </div>

          <!-- Application summary -->
          <div style="background:#fefce8;border-radius:12px;padding:20px 24px;margin-bottom:24px;font-size:13px;">
            <p style="margin:0 0 12px;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:#92400e;">Your application summary</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;width:160px;">Company</td><td style="padding:6px 0;font-weight:600;">${company_name || '—'}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;">${email}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Job title</td><td style="padding:6px 0;">${job_title || '—'}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Industry</td><td style="padding:6px 0;">${industry_sector || '—'}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Account type</td><td style="padding:6px 0;font-weight:700;color:#d97706;">${typeLabel}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Delivery freq.</td><td style="padding:6px 0;">${delivery_frequency || '—'}</td></tr>
              <tr style="border-bottom:1px solid #fde68a;"><td style="padding:6px 0;color:#64748b;">Destinations</td><td style="padding:6px 0;">${typical_destinations || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Cargo</td><td style="padding:6px 0;">${whatList}</td></tr>
            </table>
          </div>

          <p style="font-size:13px;color:#64748b;">Questions before your account manager calls?</p>
          <p style="font-size:14px;font-weight:700;margin:4px 0;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#d97706;margin:4px 0;"><a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a></p>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            BootHop Ltd · Priority Partner Programme · ${typeLabel}
          </p>
        </div>
      `,
      text: `Your Priority Partner application — what happens next\n\nYOUR ACCOUNT MANAGER WILL CALL YOU WITHIN 2 HOURS\n\nApplication received for ${company_name || email}.\n\nTimeline:\n1. AM call within 2 hours to ${phone || 'confirm contact details'}\n2. Transfer £${fee.toLocaleString()} to:\n   Account: BootHop Ltd\n   Sort: 23-08-01\n   Account No: 44947453\n   Reference: PP-${(company_name || '').replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6)||'BHOOD'}-${new Date().getFullYear()}\n3. Account activated within 1 week of payment\n4. Priority benefits: 2-hr SLA, 5% discount, monthly reports\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('priority-apply error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
