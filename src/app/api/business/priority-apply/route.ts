import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, company_name, phone, delivery_type, notes } = body;

    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from('priority_partners').upsert({
      email,
      company_name:    company_name    || null,
      phone:           phone           || null,
      delivery_volume: delivery_type   || null, // stored for admin reference
      notes:           notes           || null,
      discount_pct:    5,                        // admin updates this after review
      response_hours:  2,
      status:          'pending',
    }, { onConflict: 'email' });

    if (error) throw error;

    // Alert admin
    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
    const typeLabel  = delivery_type === 'international' ? 'International Partner (£1,000/yr)' : 'UK Partner (£500/yr)';

    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⭐ Priority Partner Application — ${company_name || email} (${typeLabel})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Business</span>
          </div>
          <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">Priority Partner Application</span>
          <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">New priority partner — awaiting payment</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;width:160px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Company</td><td style="padding:8px 0;font-weight:600;">${company_name || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Account type</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${typeLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
          </table>
          <p style="font-size:13px;color:#94a3b8;margin:24px 0 0;border-top:1px solid #f1f5f9;padding-top:16px;">
            Once payment clears, update their status to <strong>active</strong> in Supabase and set the correct discount_pct (5% or 10% based on usage).
          </p>
        </div>
      `,
      text: `Priority Partner Application\n\n${company_name || ''} (${email})\nPhone: ${phone || '—'}\nType: ${typeLabel}\nNotes: ${notes || '—'}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('priority-apply error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
