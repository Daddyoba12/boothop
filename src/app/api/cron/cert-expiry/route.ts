import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called daily at 06:00 UTC.
// Checks carrier certificate and insurance expiry dates:
//   30 days out → first warning
//    7 days out → final warning
//    0 days     → suspend carrier (set status_active = false)

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const today   = new Date();
  const in7     = new Date(today.getTime() + 7  * 86400000).toISOString().slice(0, 10);
  const in30    = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // ── Suspension: expired today ──────────────────────────────────────────
  const { data: expired } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, cert_expiry_date, insurance_expiry_date')
    .eq('status', 'active')
    .or(`cert_expiry_date.lte.${todayStr},insurance_expiry_date.lte.${todayStr}`);

  for (const c of expired ?? []) {
    await supabase.from('carrier_profiles').update({ status_active: false }).eq('id', c.id);
    await sendResendEmail({
      from,
      to: c.email,
      subject: `⚠️ Your BootHop carrier profile has been suspended — certification expired`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:32px 24px;color:#0f172a;">
          <p style="font-size:14px;color:#dc2626;font-weight:700;margin:0 0 12px;">Profile suspended</p>
          <p style="font-size:14px;margin:0 0 16px;">Dear ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your carrier profile for <strong>${c.company_name}</strong> has been suspended because one or more certifications or your insurance policy has expired.</p>
          <p style="font-size:14px;margin:0 0 16px;">To reactivate, please upload your renewed documents and email them to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a>.</p>
          <p style="font-size:13px;color:#64748b;">Questions: +44 115 661 2825 / business@boothop.com</p>
        </div>
      `,
      text: `Your BootHop carrier profile has been suspended due to expired certifications.\n\nPlease email renewed documents to carriers@boothop.com to reactivate.\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `🔴 Carrier suspended — ${c.company_name} (cert/insurance expired)`,
      text: `${c.company_name} (${c.email})\nCert expiry: ${c.cert_expiry_date || '—'}\nInsurance expiry: ${c.insurance_expiry_date || '—'}\nProfile suspended.`,
    });
  }

  // ── Final warning: 7 days ──────────────────────────────────────────────
  const { data: warn7 } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, cert_expiry_date, insurance_expiry_date')
    .eq('status', 'active')
    .eq('status_active', true)
    .or(`cert_expiry_date.eq.${in7},insurance_expiry_date.eq.${in7}`);

  for (const c of warn7 ?? []) {
    await sendResendEmail({
      from,
      to: c.email,
      subject: `⚠️ Action required — certification expires in 7 days · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:32px 24px;color:#0f172a;">
          <p style="font-size:14px;color:#f59e0b;font-weight:700;margin:0 0 8px;">Final reminder — 7 days</p>
          <p style="font-size:14px;margin:0 0 16px;">Dear ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Your certification or insurance expires in <strong>7 days</strong>. If not renewed, your profile will be automatically suspended and you will stop receiving job alerts.</p>
          <p style="font-size:14px;">Email renewed documents to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a> immediately to avoid disruption.</p>
        </div>
      `,
      text: `Final reminder: your certification or insurance expires in 7 days. Email renewed documents to carriers@boothop.com immediately to avoid suspension.\n\nQuestions: +44 115 661 2825`,
    });
  }

  // ── First warning: 30 days ─────────────────────────────────────────────
  const { data: warn30 } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, cert_expiry_date, insurance_expiry_date')
    .eq('status', 'active')
    .eq('status_active', true)
    .or(`cert_expiry_date.eq.${in30},insurance_expiry_date.eq.${in30}`);

  for (const c of warn30 ?? []) {
    await sendResendEmail({
      from,
      to: c.email,
      subject: `📋 Renewal reminder — certification expires in 30 days · ${c.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:32px 24px;color:#0f172a;">
          <p style="font-size:14px;margin:0 0 16px;">Dear ${c.contact_name || c.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">This is a reminder that your certification or insurance will expire in <strong>30 days</strong>. Please begin your renewal process now to avoid any interruption to your BootHop job alerts.</p>
          <p style="font-size:14px;">Once renewed, email your updated documents to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a>.</p>
          <p style="font-size:13px;color:#64748b;margin-top:16px;">Questions: +44 115 661 2825</p>
        </div>
      `,
      text: `Reminder: your certification or insurance expires in 30 days. Begin renewal now and email updated documents to carriers@boothop.com.\n\nQuestions: +44 115 661 2825`,
    });
  }

  return NextResponse.json({
    ok: true,
    suspended: expired?.length ?? 0,
    warned_7_days: warn7?.length ?? 0,
    warned_30_days: warn30?.length ?? 0,
  });
}
