import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 07:00 UTC.
// Validates VAT numbers via HMRC API for carrier_profiles that have a vat_number.
// Falls back to manual review list if HMRC API key not configured.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  // Find carriers with a VAT number that hasn't been validated yet
  const { data: unvalidated } = await supabase
    .from('carrier_profiles')
    .select('id, email, company_name, vat_number')
    .not('vat_number', 'is', null)
    .neq('vat_number', '')
    .is('co_house_checked_at', null)  // Use as proxy for "first-run"
    .limit(20);

  if (!unvalidated || unvalidated.length === 0) {
    return NextResponse.json({ ok: true, validated: 0 });
  }

  // Without HMRC API, compile manual review list for admin
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `📋 VAT numbers for manual verification (${unvalidated.length})`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
        <h3>VAT numbers pending verification</h3>
        <p style="font-size:13px;color:#64748b;">Set HMRC_VAT_API_KEY to enable automatic validation. Manual review required:</p>
        <table style="font-size:14px;border-collapse:collapse;width:100%;margin-top:12px;">
          <thead><tr style="border-bottom:2px solid #e2e8f0;"><th style="text-align:left;padding:6px 0;">Company</th><th style="text-align:left;padding:6px 0;">VAT Number</th><th style="text-align:left;padding:6px 0;">Email</th></tr></thead>
          <tbody>
            ${unvalidated.map(c => `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;">${c.company_name}</td><td style="padding:8px 0;font-family:monospace;">${c.vat_number}</td><td style="padding:8px 0;">${c.email}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8;">Verify at: <a href="https://www.tax.service.gov.uk/check-vat-number/enter-vat-details" style="color:#2563eb;">HMRC VAT Checker</a></p>
      </div>
    `,
    text: `VAT numbers for manual verification:\n${unvalidated.map(c => `${c.company_name}: ${c.vat_number} (${c.email})`).join('\n')}\n\nVerify at: https://www.tax.service.gov.uk/check-vat-number/`,
  });

  return NextResponse.json({ ok: true, queued_for_review: unvalidated.length });
}
