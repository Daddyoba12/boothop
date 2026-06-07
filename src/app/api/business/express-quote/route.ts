import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_name, contact_name, email, phone,
      from_location, to_location,
      cargo_type, cargo_description, cargo_weight, cargo_value,
      urgency, preferred_date, special_requirements,
    } = body;

    if (!email || !company_name) {
      return NextResponse.json({ error: 'Company name and email are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error: dbError } = await supabase.from('express_quotes').insert({
      company_name,
      contact_name:        contact_name        || null,
      email,
      phone:               phone               || null,
      from_location:       from_location       || null,
      to_location:         to_location         || null,
      cargo_type:          cargo_type          || null,
      cargo_description:   cargo_description   || null,
      cargo_weight:        cargo_weight        || null,
      cargo_value:         cargo_value         || null,
      urgency:             urgency             || null,
      preferred_date:      preferred_date      || null,
      special_requirements:special_requirements|| null,
      status:              'new',
    });

    if (dbError) throw dbError;

    const urgencyLabel: Record<string, string> = {
      same_day:  'Same-day (<8h)',
      next_day:  'Next-day (<24h)',
      scheduled: 'Scheduled',
    };

    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⚡ Express Quote Request — ${company_name} (${urgencyLabel[urgency] || urgency})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;">
            <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Express</span>
          </div>
          <span style="font-size:11px;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">Express quote request — call back within 30 min</span>
          <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">${company_name} · ${urgencyLabel[urgency] || urgency}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:180px;">Contact</td><td style="padding:8px 0;font-weight:600;">${contact_name || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;font-weight:700;color:#059669;">${phone || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;font-weight:600;">${from_location || '—'} → ${to_location || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Urgency</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${urgencyLabel[urgency] || urgency}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Cargo type</td><td style="padding:8px 0;">${cargo_type || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Description</td><td style="padding:8px 0;">${cargo_description || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Weight / Value</td><td style="padding:8px 0;">${cargo_weight || '—'} / ${cargo_value || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Preferred date</td><td style="padding:8px 0;">${preferred_date || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Special req.</td><td style="padding:8px 0;">${special_requirements || '—'}</td></tr>
          </table>
          <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            Call back within 30 minutes to confirm carrier availability and pricing.
          </p>
        </div>
      `,
      text: `Express Quote — ${company_name}\n${contact_name || ''} | ${phone || '—'} | ${email}\nRoute: ${from_location || '—'} → ${to_location || '—'}\nUrgency: ${urgencyLabel[urgency] || urgency}\nCargo: ${cargo_type || '—'} — ${cargo_description || '—'}\nWeight: ${cargo_weight || '—'} | Value: ${cargo_value || '—'}\nSpecial: ${special_requirements || '—'}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('express-quote error:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
