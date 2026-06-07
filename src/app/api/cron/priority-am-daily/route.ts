import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

// Daily at 08:00 UTC (weekdays).
// Sends admin a morning briefing of all Priority Partner applications outstanding —
// those still in payment_pending with no AM call logged.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const { data: outstanding } = await supabase
    .from('priority_partners')
    .select('id, email, company_name, phone, job_title, industry_sector, annual_fee, delivery_type, created_at, am_called_at')
    .eq('status', 'payment_pending')
    .order('created_at', { ascending: true });

  const uncalled  = (outstanding ?? []).filter(p => !p.am_called_at);
  const called    = (outstanding ?? []).filter(p => p.am_called_at);

  if (!outstanding || outstanding.length === 0) {
    return NextResponse.json({ ok: true, outstanding: 0 });
  }

  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `📋 Priority AM morning brief — ${uncalled.length} uncalled, ${called.length} awaiting payment`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority AM Brief</span></div>
        <h2 style="font-size:20px;margin:0 0 4px;">Good morning.</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 24px;">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        ${uncalled.length > 0 ? `
        <div style="background:#fee2e2;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-weight:700;color:#dc2626;">Uncalled — AM contact required (${uncalled.length})</p>
          ${uncalled.map(p => `
            <div style="border-bottom:1px solid rgba(220,38,38,0.2);padding:8px 0;font-size:13px;">
              <strong>${p.company_name || p.email}</strong> — ${p.job_title || '—'} — ${p.delivery_type === 'international' ? 'International' : 'UK'} (£${(p.annual_fee ?? 0).toLocaleString()}/yr)<br>
              <span style="color:#64748b;">📞 ${p.phone || 'No phone — email only'} · Applied ${new Date(p.created_at as string).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ${new Date(p.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          `).join('')}
        </div>` : ''}

        ${called.length > 0 ? `
        <div style="background:#fef3c7;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-weight:700;color:#92400e;">AM called — awaiting payment (${called.length})</p>
          ${called.map(p => `
            <div style="border-bottom:1px solid rgba(245,158,11,0.2);padding:8px 0;font-size:13px;">
              <strong>${p.company_name || p.email}</strong> — ${p.delivery_type === 'international' ? 'International' : 'UK'} (£${(p.annual_fee ?? 0).toLocaleString()}/yr) · Called ${new Date(p.am_called_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          `).join('')}
        </div>` : ''}

        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">Priority AM Dashboard · ${new Date().toLocaleDateString('en-GB')}</p>
      </div>
    `,
    text: `Priority AM Brief — ${new Date().toLocaleDateString('en-GB')}\n\nUncalled (${uncalled.length}):\n${uncalled.map(p => `- ${p.company_name || p.email}: ${p.phone || 'no phone'} (£${(p.annual_fee ?? 0).toLocaleString()}/yr)`).join('\n')}\n\nAwaiting payment (${called.length}):\n${called.map(p => `- ${p.company_name || p.email} (£${(p.annual_fee ?? 0).toLocaleString()}/yr)`).join('\n')}`,
  });

  return NextResponse.json({ ok: true, uncalled: uncalled.length, called: called.length });
}
