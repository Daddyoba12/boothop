import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Step 1: Company Identity
      company_name, company_reg_number, vat_number,
      contact_name, email, phone, your_role, base_location,
      // Step 2: Fleet & Operations
      fleet_size, vehicle_types, operating_hours, coverage_area,
      // Step 3: Certifications
      cert_adr, cert_iata_dg, cert_gdp, cert_aviation_security,
      cert_iso9001, cert_tapa, cert_medical,
      // Cargo
      cargo_aog, cargo_industrial, cargo_pharma, cargo_electronics,
      cargo_automotive, cargo_general,
      // Services
      svc_sameday_uk, svc_international, svc_airport,
      svc_ooh, svc_refrigerated, svc_hazmat,
      insurance_filename,
      // Step 4: Banking & Terms
      bank_account_name, sort_code, account_number,
      how_did_you_hear, notes, agreed_to_terms,
    } = body;

    if (!email || !company_name) {
      return NextResponse.json({ error: 'Company name and email are required.' }, { status: 400 });
    }
    if (!company_reg_number) {
      return NextResponse.json({ error: 'Companies House registration number is required.' }, { status: 400 });
    }
    if (!agreed_to_terms) {
      return NextResponse.json({ error: 'You must agree to the Carrier Agreement.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error: dbError } = await supabase.from('carrier_profiles').upsert({
      company_name,
      company_reg_number:     company_reg_number     || null,
      vat_number:             vat_number             || null,
      contact_name:           contact_name           || null,
      email,
      phone:                  phone                  || null,
      your_role:              your_role              || null,
      base_location:          base_location          || null,
      fleet_size:             fleet_size             || null,
      vehicle_types:          vehicle_types          ?? [],
      operating_hours:        operating_hours        || null,
      coverage_area:          coverage_area          || null,
      cert_adr:               cert_adr               ?? false,
      cert_iata_dg:           cert_iata_dg           ?? false,
      cert_gdp:               cert_gdp               ?? false,
      cert_aviation_security: cert_aviation_security ?? false,
      cert_iso9001:           cert_iso9001           ?? false,
      cert_tapa:              cert_tapa              ?? false,
      cert_medical:           cert_medical           ?? false,
      cargo_aog:              cargo_aog              ?? false,
      cargo_industrial:       cargo_industrial       ?? false,
      cargo_pharma:           cargo_pharma           ?? false,
      cargo_electronics:      cargo_electronics      ?? false,
      cargo_automotive:       cargo_automotive       ?? false,
      cargo_general:          cargo_general          ?? false,
      svc_sameday_uk:         svc_sameday_uk         ?? false,
      svc_international:      svc_international      ?? false,
      svc_airport:            svc_airport            ?? false,
      svc_ooh:                svc_ooh                ?? false,
      svc_refrigerated:       svc_refrigerated       ?? false,
      svc_hazmat:             svc_hazmat             ?? false,
      bank_account_name:      bank_account_name      || null,
      sort_code:              sort_code              || null,
      account_number:         account_number         || null,
      how_did_you_hear:       how_did_you_hear       || null,
      notes:                  notes                  || null,
      agreed_to_terms:        agreed_to_terms        ?? false,
      insurance_filename:     insurance_filename     || null,
      status:                 'payment_pending',
    }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // Build summary strings for admin email
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

    const vehicleList = Array.isArray(vehicle_types) ? vehicle_types.join(', ') : '—';

    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
    const regRef     = `CN-${company_name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)}-REG`;

    // ── Admin notification ────────────────────────────────────────────────
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `🚛 Carrier Network Application — ${company_name} (£250 payment pending)`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:22px;font-weight:900;color:#60a5fa;">Hop Carrier Network</span>
          </div>
          <span style="font-size:11px;background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New carrier application — awaiting £250 payment</span>
          <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">${company_name}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:200px;">Companies House No.</td><td style="padding:8px 0;font-weight:700;">${company_reg_number || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">VAT number</td><td style="padding:8px 0;">${vat_number || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Contact</td><td style="padding:8px 0;font-weight:600;">${contact_name || '—'} (${your_role || '—'})</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${phone || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Base location</td><td style="padding:8px 0;">${base_location || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Fleet size</td><td style="padding:8px 0;">${fleet_size || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Vehicle types</td><td style="padding:8px 0;">${vehicleList}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Operating hours</td><td style="padding:8px 0;">${operating_hours || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Coverage area</td><td style="padding:8px 0;">${coverage_area || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Certifications</td><td style="padding:8px 0;font-weight:600;color:#2563eb;">${certs}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Cargo types</td><td style="padding:8px 0;">${cargo}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Services</td><td style="padding:8px 0;">${services}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Bank account</td><td style="padding:8px 0;">${bank_account_name || '—'} · SC: ${sort_code || '—'} · AC: ${account_number || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">How they found us</td><td style="padding:8px 0;">${how_did_you_hear || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Insurance cert</td><td style="padding:8px 0;">${insurance_filename || '⚠ Not uploaded — follow up by email'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
          </table>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
            <strong>Action required:</strong> Awaiting £250 registration payment.<br>
            Reference: <strong>${regRef}</strong><br>
            Once payment confirms, set status → <strong>active</strong> in Supabase (carrier_profiles table).<br>
            Payment terms for completed jobs: <strong>within 1 week of delivery confirmation</strong>.
          </div>
          <p style="font-size:12px;color:#94a3b8;">Carrier agreed to terms: ${agreed_to_terms ? 'Yes ✓' : 'No ✗'}</p>
        </div>
      `,
      text: `Carrier Application — ${company_name}\n${email} | ${phone || '—'}\nCompanies House: ${company_reg_number || '—'}\nBase: ${base_location || '—'} | Fleet: ${fleet_size || '—'}\nVehicles: ${vehicleList}\nCerts: ${certs}\nCargo: ${cargo}\nServices: ${services}\nBanking: ${bank_account_name || '—'} | SC: ${sort_code || '—'} | AC: ${account_number || '—'}\nAwaiting £250 payment. Ref: ${regRef}\nPay carriers within 1 week of job completion.`,
    });

    // ── Applicant confirmation email ─────────────────────────────────────
    await resend.emails.send({
      from,
      to: email,
      subject: `Application received — ${company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:22px;font-weight:900;color:#60a5fa;">Hop</span>
            <span style="font-size:13px;color:#64748b;margin-left:8px;">Carrier Network</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;">Application received.</h2>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;">
            Thank you, ${contact_name || company_name}. We have received your carrier application for <strong>${company_name}</strong>. Here is what happens next.
          </p>

          <!-- Timeline steps -->
          <div style="border-left:3px solid #2563eb;padding-left:20px;margin-bottom:28px;">
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">1. Companies House check</p>
              <p style="margin:0;font-size:13px;color:#64748b;">We are verifying your registration number <strong>${company_reg_number}</strong> with Companies House now. This usually completes within 24 hours.</p>
            </div>
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">2. Insurance document review</p>
              <p style="margin:0;font-size:13px;color:#64748b;">${insurance_filename ? `Your document <strong>${insurance_filename}</strong> is in the queue — our team will review it within 4 hours.` : 'You did not upload an insurance certificate. Please email it to <a href="mailto:carriers@boothop.com" style="color:#2563eb;">carriers@boothop.com</a> using subject line <strong>' + regRef + '</strong>.'}</p>
            </div>
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">3. Pay your £250 registration fee</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Transfer to the details below. Use your reference exactly so we can match it.</p>
              <table style="font-size:13px;border-collapse:collapse;">
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account name</td><td style="font-weight:700;">BootHop Ltd</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Sort code</td><td style="font-weight:700;">23-08-01</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Account number</td><td style="font-weight:700;">44947453</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Reference</td><td style="font-weight:900;color:#2563eb;font-family:monospace;">${regRef}</td></tr>
                <tr><td style="color:#64748b;padding:3px 12px 3px 0;">Amount</td><td style="font-weight:900;font-size:16px;">£250</td></tr>
              </table>
            </div>
            <div>
              <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a;">4. Profile activated — job alerts begin</p>
              <p style="margin:0;font-size:13px;color:#64748b;">Once your £250 clears (2 working days), your profile goes live. You will receive job alerts by email within your coverage area — <strong>${base_location || 'your registered base'}</strong>.</p>
            </div>
          </div>

          <!-- Application summary -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;font-size:13px;">
            <p style="margin:0 0 12px;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:#64748b;">Your application summary</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;width:160px;">Company</td><td style="padding:6px 0;font-weight:600;">${company_name}</td></tr>
              <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Reg. number</td><td style="padding:6px 0;">${company_reg_number}</td></tr>
              <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Base</td><td style="padding:6px 0;">${base_location || '—'}</td></tr>
              <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Fleet size</td><td style="padding:6px 0;">${fleet_size || '—'}</td></tr>
              <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Vehicles</td><td style="padding:6px 0;">${vehicleList}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Certifications</td><td style="padding:6px 0;">${certs}</td></tr>
            </table>
          </div>

          <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
            <strong style="font-size:13px;">Earnings model:</strong>
            <p style="margin:6px 0 0;font-size:13px;color:#1e40af;">You receive <strong>70% of the posted job rate</strong> for every completed delivery, paid within 1 week of confirmed delivery. BootHop retains 30% as the platform fee.</p>
          </div>

          <p style="font-size:13px;color:#64748b;">Questions? Contact your carrier onboarding team:</p>
          <p style="font-size:14px;font-weight:700;margin:4px 0;">+44 115 661 2825</p>
          <p style="font-size:13px;color:#2563eb;margin:4px 0;"><a href="mailto:business@boothop.com" style="color:#2563eb;">business@boothop.com</a></p>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            BootHop Ltd · Carrier Network · Reference: ${regRef}
          </p>
        </div>
      `,
      text: `Application received — ${company_name}\n\nThank you, ${contact_name || company_name}.\n\nNext steps:\n1. Companies House check on ${company_reg_number} — 24 hours\n2. Insurance review — 4 hours\n3. Pay £250 registration fee:\n   Account: BootHop Ltd\n   Sort: 23-08-01\n   Account No: 44947453\n   Reference: ${regRef}\n   Amount: £250\n4. Profile activated within 2 working days of payment — job alerts begin\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('carrier-apply error:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
