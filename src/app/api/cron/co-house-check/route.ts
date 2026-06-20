import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called daily at 06:30 UTC.
// Verifies company registration numbers via Companies House API for unverified carriers.
// Falls back to marking for manual review if the API key is not configured.

const CH_BASE = 'https://api.company-information.service.gov.uk';

interface CHCompany {
  company_status: string;
  company_name: string;
  type: string;
}

async function checkCompaniesHouse(regNum: string): Promise<{ ok: boolean; name?: string; status?: string; error?: string }> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'COMPANIES_HOUSE_API_KEY not configured' };
  }
  try {
    const res = await fetch(`${CH_BASE}/company/${regNum.toUpperCase()}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    });
    if (!res.ok) return { ok: false, error: `CH API returned ${res.status}` };
    const data = await res.json() as CHCompany;
    return {
      ok: data.company_status === 'active',
      name: data.company_name,
      status: data.company_status,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  // Find carriers not yet checked
  const { data: unverified, error } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, company_reg_number')
    .eq('co_house_verified', false)
    .is('co_house_checked_at', null)
    .not('company_reg_number', 'is', null)
    .limit(20);  // Process up to 20 per run to respect API limits

  if (error) {
    console.error('co-house-check: fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let verified = 0;
  let failed   = 0;
  let skipped  = 0;

  for (const c of unverified ?? []) {
    const result = await checkCompaniesHouse(c.company_reg_number);

    if (result.error === 'COMPANIES_HOUSE_API_KEY not configured') {
      // Manual review mode — alert admin once per run not per carrier
      skipped = (unverified?.length ?? 0);
      await sendResendEmail({
        from,
        to: adminEmail,
        subject: `📋 ${unverified?.length} carrier${unverified?.length !== 1 ? 's' : ''} awaiting manual Companies House verification`,
        html: `<div style="font-family:Arial,sans-serif;padding:24px;"><p style="font-size:14px;">No Companies House API key configured. The following carriers require manual verification:</p><ul style="font-size:14px;">${(unverified ?? []).map(c => `<li><strong>${c.company_name}</strong> — ${c.company_reg_number} (${c.email})</li>`).join('')}</ul><p style="font-size:13px;color:#64748b;">Set COMPANIES_HOUSE_API_KEY in environment variables to enable automatic verification.</p></div>`,
        text: `${unverified?.length} carriers awaiting manual Companies House verification:\n${(unverified ?? []).map(c => `- ${c.company_name}: ${c.company_reg_number}`).join('\n')}`,
      });
      break;
    }

    // Mark as checked regardless of result
    await supabase.from('carrier_profiles').update({
      co_house_verified:   result.ok,
      co_house_checked_at: new Date().toISOString(),
    }).eq('id', c.id);

    if (result.ok) {
      // Verified — notify admin
      await sendResendEmail({
        from,
        to: adminEmail,
        subject: `✅ Companies House verified — ${c.company_name} (${c.company_reg_number})`,
        text: `${c.company_name} (${c.company_reg_number}) is confirmed active on Companies House.\nCH name: ${result.name || '—'}\nCarrier email: ${c.email}`,
      });
      verified++;
    } else {
      // Failed — notify admin and carrier
      await sendResendEmail({
        from,
        to: adminEmail,
        subject: `⚠️ Companies House check failed — ${c.company_name} (${c.company_reg_number})`,
        html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h3>Companies House verification failed</h3><p><strong>${c.company_name}</strong> (${c.company_reg_number})<br>Email: ${c.email}<br>Reason: ${result.error || 'Company not found or not active (status: ' + result.status + ')'}</p><p>Please review manually and contact the carrier if required.</p></div>`,
        text: `CH check failed: ${c.company_name} (${c.company_reg_number})\nReason: ${result.error || result.status}\nCarrier: ${c.email}`,
      });
      await sendResendEmail({
        from,
        to: c.email,
        subject: `Action required — Companies House verification for ${c.company_name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
            <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
            <h2 style="color:#dc2626;margin:0 0 12px;">Companies House verification — action required</h2>
            <p style="font-size:14px;margin:0 0 16px;">Dear ${c.contact_name || c.company_name},</p>
            <p style="font-size:14px;margin:0 0 16px;">We were unable to verify <strong>${c.company_name}</strong> using registration number <strong>${c.company_reg_number}</strong> on Companies House.</p>
            <p style="font-size:14px;margin:0 0 16px;">Please check your registration number and reply to this email or call us to resolve this.</p>
            <p style="font-size:14px;font-weight:700;">+44 115 661 2825</p>
            <p style="font-size:13px;"><a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
          </div>
        `,
        text: `We could not verify ${c.company_name} (${c.company_reg_number}) on Companies House.\n\nPlease check your registration number and contact us.\n\n+44 115 661 2825 / business@boothop.com`,
      });
      failed++;
    }
  }

  return NextResponse.json({ ok: true, verified, failed, skipped });
}
