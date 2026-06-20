import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Every 15 minutes.
// Reminds assigned carrier to collect if 30+ minutes have passed since assignment.
// Escalates to ops if 60+ minutes with no collection confirmed.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now      = Date.now();
  const mins30   = new Date(now - 30 * 60000).toISOString();
  const mins60   = new Date(now - 60 * 60000).toISOString();
  const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

  // Escalation: assigned 60+ min ago, still not collected
  const { data: late } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(email, contact_name, company_name)`)
    .eq('status', 'assigned')
    .is('collected_at', null)
    .lte('assigned_at', mins60);

  for (const job of late ?? []) {
    const carrier = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `🚨 ${job.reference} — carrier not collected after 60 min`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h3 style="color:#dc2626;">Collection overdue — 60 minutes</h3><p><strong>${job.reference}</strong><br>Carrier: ${carrier?.company_name || '—'} (${carrier?.email || '—'})<br>Pickup: ${job.pickup_address || '—'}<br>Assigned at: ${job.assigned_at}</p><p>Call carrier immediately. If unreachable, reassign or arrange BootHop Direct.</p></div>`,
      text: `${job.reference}: carrier ${carrier?.company_name} has not collected after 60 min. Pickup: ${job.pickup_address}. Call: ${carrier?.email}`,
    });
  }

  // Reminder: assigned 30–60 min ago, not collected
  const { data: remind } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(email, contact_name, company_name)`)
    .eq('status', 'assigned')
    .is('collected_at', null)
    .lte('assigned_at', mins30)
    .gt('assigned_at', mins60);

  for (const job of remind ?? []) {
    const carrier = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
    if (!carrier?.email) continue;

    const { createHmac } = await import('crypto');
    const secret = process.env.JOB_STATUS_SECRET || 'boothop-jobs-secret-2026';
    const token  = createHmac('sha256', secret).update(`${job.id}:collected`).digest('hex').slice(0, 16);

    await sendResendEmail({
      from,
      to: carrier.email,
      subject: `⏰ Reminder — please collect job ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <p style="font-size:14px;">Hi ${carrier.contact_name || carrier.company_name},</p>
          <p style="font-size:14px;">This is a reminder to collect job <strong>${job.reference}</strong>.</p>
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:16px 0;font-size:14px;">
            <p style="margin:0 0 6px;font-weight:700;">Pickup address:</p>
            <p style="margin:0;">${job.pickup_address || '—'}</p>
            <p style="margin:6px 0 0;color:#64748b;">${job.pickup_contact || ''} ${job.pickup_phone ? '· ' + job.pickup_phone : ''}</p>
          </div>
          <a href="${APP_URL}/api/business/jobs/status?job=${job.id}&action=collected&token=${token}" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;">Confirm collected</a>
          <p style="margin-top:16px;font-size:13px;color:#64748b;">Problems? Call ops: +44 115 661 2825</p>
        </div>
      `,
      text: `Reminder: please collect job ${job.reference}.\nPickup: ${job.pickup_address}\nContact: ${job.pickup_contact} ${job.pickup_phone || ''}\n\nConfirm collected: ${APP_URL}/api/business/jobs/status?job=${job.id}&action=collected&token=${token}\n\nOps: +44 115 661 2825`,
    });
  }

  return NextResponse.json({ ok: true, escalated: late?.length ?? 0, reminded: remind?.length ?? 0 });
}
