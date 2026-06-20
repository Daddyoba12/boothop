import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// GET  /api/admin/priority?status=all
// PATCH /api/admin/priority { id, ...fields }

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const status   = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('priority_partners')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ partners: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), ...fields };

  const { data: partner, error: fetchErr } = await supabase
    .from('priority_partners')
    .select('email, company_name, annual_fee, delivery_type, status')
    .eq('id', id)
    .single();

  if (fetchErr || !partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase.from('priority_partners').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send activation email if status just changed to active
  if (fields.status === 'active' && partner.status !== 'active') {
    const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
    const fee    = partner.annual_fee ?? 0;

    await sendResendEmail({
      from,
      to: partner.email,
      subject: `✅ Priority Partner account activated — ${partner.company_name || partner.email}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <div style="background:#fef3c7;border-radius:12px;padding:14px 20px;margin-bottom:20px;">
            <p style="margin:0;font-weight:700;font-size:14px;color:#92400e;">✅ Your account is now active.</p>
          </div>
          <h2 style="font-size:20px;margin:0 0 8px;">Welcome to BootHop Priority, ${partner.company_name || 'valued partner'}.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 20px;">Your Priority Partner membership is now live. All your bookings will now receive Priority treatment.</p>
          <div style="border-left:3px solid #f59e0b;padding-left:14px;font-size:13px;margin-bottom:20px;">
            <p style="margin:0 0 8px;">✅ 2-hour response SLA on all deliveries</p>
            <p style="margin:0 0 8px;">✅ 5% member discount applied automatically</p>
            <p style="margin:0 0 8px;">✅ Dedicated account manager assigned</p>
            <p style="margin:0;">✅ Monthly delivery report on the 1st of each month</p>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:20px;">
            <strong>Make your first Priority booking:</strong><br>
            Call <strong>+44 115 661 2825</strong> or email <a href="mailto:business@boothop.com" style="color:#d97706;">business@boothop.com</a> and reference your company name <strong>${partner.company_name || ''}</strong>.
          </div>
          <p style="font-size:12px;color:#94a3b8;">${partner.delivery_type === 'international' ? 'International' : 'UK'} Priority Partner · £${fee.toLocaleString()}/yr</p>
        </div>
      `,
      text: `Your BootHop Priority account is now active!\n\nBenefits: 2-hr SLA, 5% discount, dedicated AM, monthly reports.\n\nFirst booking: +44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({ ok: true });
}
