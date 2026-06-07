import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_name, contact_name, email, phone, base_location, fleet_size,
      // certifications
      cert_adr, cert_iata_dg, cert_gdp, cert_aviation_security,
      cert_iso9001, cert_tapa, cert_medical,
      // cargo
      cargo_aog, cargo_industrial, cargo_pharma, cargo_electronics,
      cargo_automotive, cargo_general,
      // services
      svc_sameday_uk, svc_international, svc_airport,
      svc_ooh, svc_refrigerated, svc_hazmat,
      notes,
    } = body;

    if (!email || !company_name) {
      return NextResponse.json({ error: 'Company name and email are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error: dbError } = await supabase.from('carrier_profiles').upsert({
      company_name,
      contact_name:   contact_name  || null,
      email,
      phone:          phone         || null,
      base_location:  base_location || null,
      fleet_size:     fleet_size    || null,
      // certifications
      cert_adr:               cert_adr               ?? false,
      cert_iata_dg:           cert_iata_dg           ?? false,
      cert_gdp:               cert_gdp               ?? false,
      cert_aviation_security: cert_aviation_security ?? false,
      cert_iso9001:           cert_iso9001           ?? false,
      cert_tapa:              cert_tapa              ?? false,
      cert_medical:           cert_medical           ?? false,
      // cargo categories
      cargo_aog:        cargo_aog        ?? false,
      cargo_industrial: cargo_industrial ?? false,
      cargo_pharma:     cargo_pharma     ?? false,
      cargo_electronics:cargo_electronics?? false,
      cargo_automotive: cargo_automotive ?? false,
      cargo_general:    cargo_general    ?? false,
      // service capabilities
      svc_sameday_uk:   svc_sameday_uk   ?? false,
      svc_international:svc_international?? false,
      svc_airport:      svc_airport      ?? false,
      svc_ooh:          svc_ooh          ?? false,
      svc_refrigerated: svc_refrigerated ?? false,
      svc_hazmat:       svc_hazmat       ?? false,
      notes:            notes            || null,
      status:           'pending',
    }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // Build capabilities summary for admin email
    const certs = [
      cert_adr && 'ADR', cert_iata_dg && 'IATA DG', cert_gdp && 'GDP Pharma',
      cert_aviation_security && 'Aviation Security', cert_iso9001 && 'ISO 9001',
      cert_tapa && 'TAPA', cert_medical && 'Medical',
    ].filter(Boolean).join(', ') || 'None declared';

    const services = [
      svc_sameday_uk && 'Same-day UK', svc_international && 'International',
      svc_airport && 'Airport-to-airport', svc_ooh && 'Night/OOH',
      svc_refrigerated && 'Refrigerated', svc_hazmat && 'Hazmat',
    ].filter(Boolean).join(', ') || 'None declared';

    const cargo = [
      cargo_aog && 'AOG', cargo_industrial && 'Industrial', cargo_pharma && 'Pharma',
      cargo_electronics && 'Electronics', cargo_automotive && 'Automotive', cargo_general && 'General',
    ].filter(Boolean).join(', ') || 'None declared';

    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `🚛 Carrier Network Application — ${company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:22px;font-weight:900;color:#60a5fa;">Hop Carrier Network</span>
          </div>
          <span style="font-size:11px;background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New carrier application</span>
          <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">${company_name}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:180px;">Contact</td><td style="padding:8px 0;font-weight:600;">${contact_name || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${phone || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Base location</td><td style="padding:8px 0;">${base_location || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Fleet size</td><td style="padding:8px 0;">${fleet_size || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Certifications</td><td style="padding:8px 0;font-weight:600;color:#2563eb;">${certs}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Cargo types</td><td style="padding:8px 0;">${cargo}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Services</td><td style="padding:8px 0;">${services}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
          </table>
          <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            Review this carrier in Supabase → carrier_profiles table. Set status to <strong>active</strong> once verified.
          </p>
        </div>
      `,
      text: `Carrier Network Application\n\n${company_name}\n${email} | ${phone || '—'}\nBase: ${base_location || '—'} | Fleet: ${fleet_size || '—'}\nCerts: ${certs}\nCargo: ${cargo}\nServices: ${services}\nNotes: ${notes || '—'}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('carrier-apply error:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
