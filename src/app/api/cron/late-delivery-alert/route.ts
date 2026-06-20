import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Every 30 minutes.
// Flags in-transit jobs that are taking too long based on delivery type:
//   UK jobs: alert after 4 hours in transit
//   International jobs: alert after 48 hours in transit

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now    = Date.now();
  const hrs4   = new Date(now - 4  * 3600000).toISOString();
  const hrs48  = new Date(now - 48 * 3600000).toISOString();

  // UK jobs in transit for 4+ hours
  const { data: lateUK } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(email, contact_name, company_name, phone)`)
    .eq('status', 'in_transit')
    .eq('delivery_type', 'uk')
    .is('delivered_at', null)
    .lte('in_transit_at', hrs4);

  // International jobs in transit for 48+ hours
  const { data: lateIntl } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(email, contact_name, company_name, phone)`)
    .eq('status', 'in_transit')
    .eq('delivery_type', 'international')
    .is('delivered_at', null)
    .lte('in_transit_at', hrs48);

  const allLate = [...(lateUK ?? []), ...(lateIntl ?? [])];

  for (const job of allLate) {
    const carrier = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
    const threshold = job.delivery_type === 'uk' ? '4 hours' : '48 hours';

    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `⚠️ ${job.reference} — late delivery (${threshold} in transit) · ${job.delivery_type?.toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h3 style="color:#f59e0b;">Late delivery alert — ${threshold} in transit</h3>
          <table style="font-size:14px;border-collapse:collapse;width:100%;max-width:500px;">
            <tr><td style="padding:6px 0;color:#64748b;width:150px;">Reference</td><td style="font-weight:700;">${job.reference}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Carrier</td><td>${carrier?.company_name || '—'} · ${carrier?.email || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Client</td><td>${job.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Route</td><td>${job.pickup_address || '—'} → ${job.delivery_address || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">In transit since</td><td>${job.in_transit_at}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:13px;background:#fef3c7;border-radius:6px;padding:10px;">
            <strong>Action:</strong> Call carrier ${carrier?.company_name} to get ETA update. If unreachable, contact client at ${job.client_email}.
          </p>
        </div>
      `,
      text: `Late delivery alert: ${job.reference} (${threshold} in transit)\nCarrier: ${carrier?.company_name} (${carrier?.email})\nRoute: ${job.pickup_address} → ${job.delivery_address}\nIn transit since: ${job.in_transit_at}`,
    });

    // Also alert client
    await sendResendEmail({
      from,
      to: job.client_email,
      subject: `Update on your delivery — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Update on your delivery</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Reference: <strong>${job.reference}</strong></p>
          <p style="font-size:14px;">We want to keep you updated. Your shipment is currently in transit. Our team is monitoring progress and will be in touch if there are any changes to the expected delivery time.</p>
          <p style="font-size:14px;">If you have any questions or need an urgent update, please contact us:</p>
          <p style="font-size:15px;font-weight:700;">+44 115 661 2825</p>
          <p style="font-size:13px;"><a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a></p>
        </div>
      `,
      text: `Update on delivery ${job.reference}.\n\nYour shipment is in transit. Our team is monitoring progress.\n\nQuestions: +44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({ ok: true, flagged: allLate.length });
}
