import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Every 30 minutes (same schedule as priority-am).
// Monitors active Priority Partner jobs for 2-hour response SLA compliance.
// Alerts ops if a Priority job has been in 'received' or 'matching' for 90+ minutes.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const mins90 = new Date(Date.now() - 90 * 60000).toISOString();
  const hrs2   = new Date(Date.now() - 2 * 3600000).toISOString();

  // Priority jobs unmatched for 90+ minutes
  const { data: breaching } = await supabase
    .from('jobs')
    .select('id, reference, client_email, client_company, client_paid, pickup_address, delivery_address, created_at, matched_at')
    .eq('client_type', 'priority')
    .in('status', ['received', 'matching'])
    .lte('created_at', mins90);

  for (const job of breaching ?? []) {
    const minsWaiting = Math.floor((Date.now() - new Date(job.created_at as string).getTime()) / 60000);
    const isCritical  = minsWaiting >= 120;

    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `${isCritical ? '🚨 SLA BREACH' : '⚠️ SLA WARNING'} — Priority job ${job.reference} · ${minsWaiting} min unmatched`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h3 style="color:${isCritical ? '#dc2626' : '#f59e0b'};">Priority SLA ${isCritical ? 'BREACH' : 'WARNING'} — ${minsWaiting} minutes</h3>
          <p style="font-size:14px;">Priority client job <strong>${job.reference}</strong> has been waiting ${minsWaiting} minutes for a carrier. Priority SLA is <strong>2 hours</strong>.</p>
          <table style="font-size:14px;border-collapse:collapse;width:100%;max-width:500px;margin:16px 0;">
            <tr><td style="padding:6px 0;color:#64748b;width:150px;">Client</td><td>${job.client_company || job.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Email</td><td>${job.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Route</td><td>${job.pickup_address || '—'} → ${job.delivery_address || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Value</td><td>£${(job.client_paid ?? 0).toLocaleString()}</td></tr>
          </table>
          <div style="background:${isCritical ? '#fee2e2' : '#fef3c7'};border-radius:6px;padding:12px 16px;font-size:13px;">
            <strong>Action required:</strong> ${isCritical ? 'SLA BREACHED. Call client immediately and arrange BootHop Direct.' : 'Widen matching radius and consider BootHop Direct.'}
          </div>
        </div>
      `,
      text: `Priority SLA ${isCritical ? 'BREACH' : 'WARNING'}: ${job.reference} — ${minsWaiting} min unmatched.\nClient: ${job.client_company || job.client_email}\nRoute: ${job.pickup_address} → ${job.delivery_address}\n${isCritical ? 'CALL CLIENT IMMEDIATELY.' : 'Consider BootHop Direct.'}`,
    });
  }

  return NextResponse.json({ ok: true, sla_issues: breaching?.length ?? 0 });
}
