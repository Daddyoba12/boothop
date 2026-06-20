import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called every 2 minutes by Vercel Cron.
// Finds 'received' jobs, alerts all eligible active partners, transitions to 'matching'.

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  // Find all jobs awaiting partner matching
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'received')
    .order('created_at', { ascending: true });

  if (jobsErr) {
    console.error('job-engine: jobs fetch error', jobsErr);
    return NextResponse.json({ error: jobsErr.message }, { status: 500 });
  }
  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // Find all active, verified partners
  const { data: partners, error: partnerErr } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, coverage_area, vehicle_types, base_location')
    .eq('status', 'active')
    .eq('status_active', true);

  if (partnerErr) {
    console.error('job-engine: partners fetch error', partnerErr);
    return NextResponse.json({ error: partnerErr.message }, { status: 500 });
  }

  let processed = 0;

  for (const job of jobs) {
    // Filter partners by delivery type compatibility
    const eligible = (partners ?? []).filter((p) => {
      if (job.delivery_type === 'international') {
        return Array.isArray(p.vehicle_types)
          ? p.vehicle_types.some((v: string) => v.toLowerCase().includes('van') || v.toLowerCase().includes('truck') || v.toLowerCase().includes('air'))
          : true;
      }
      return true;
    });

    if (eligible.length === 0) {
      // No partners available — alert ops immediately
      await notifyOps(from, job, 'No active partners found — BootHop Direct required');
      await supabase.from('jobs').update({
        status: 'matching',
        matched_at: new Date().toISOString(),
        is_boothop_direct: true,
      }).eq('id', job.id);
      continue;
    }

    // Build job alert HTML for partners (never discloses client price)
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const expiresStr = expiresAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const pickupArea = job.pickup_postcode || (job.pickup_address?.split(',').pop()?.trim()) || 'UK';
    const deliveryDest = job.delivery_postcode || (job.delivery_address?.split(',').pop()?.trim()) || '—';
    const partnerPayout = job.partner_rate ? `£${job.partner_rate.toLocaleString()}` : 'Quoted on acceptance';

    // Insert match log records and send alerts simultaneously
    const matchLogRows = eligible.map((p) => ({
      job_id:       job.id,
      partner_id:   p.id,
      radius_miles: job.match_radius_miles,
      alerted_at:   new Date().toISOString(),
      response:     null,
    }));

    await supabase.from('job_match_log').insert(matchLogRows);

    // Send partner alerts (fire-and-forget per partner)
    await Promise.allSettled(
      eligible.map((partner) =>
        sendResendEmail({
          from,
          to: partner.email,
          subject: `⚡ New job available — ${job.reference} · ${job.delivery_type === 'uk' ? 'UK' : 'International'} · Expires ${expiresStr}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
              <div style="margin-bottom:16px;">
                <span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span>
                <span style="font-size:12px;color:#64748b;margin-left:6px;">Job Alert</span>
              </div>
              <div style="background:#fef3c7;border-radius:8px;padding:10px 16px;margin-bottom:20px;display:inline-block;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#92400e;">Action required — expires ${expiresStr}</span>
              </div>
              <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;">${job.reference}</h2>
              <p style="margin:0 0 20px;color:#64748b;">${job.delivery_type === 'uk' ? 'UK Delivery' : 'International Delivery'} · ${job.package_size ? job.package_size.charAt(0).toUpperCase() + job.package_size.slice(1) : '—'}</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:140px;">Collection area</td><td style="padding:8px 0;font-weight:700;">${pickupArea}</td></tr>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Destination</td><td style="padding:8px 0;font-weight:700;">${deliveryDest}</td></tr>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Your payout</td><td style="padding:8px 0;font-weight:900;font-size:18px;color:#059669;">${partnerPayout}</td></tr>
                <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Package</td><td style="padding:8px 0;">${job.cargo_description || job.package_size || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Special notes</td><td style="padding:8px 0;">${job.special_instructions || 'None'}</td></tr>
              </table>
              <div style="text-align:center;margin-bottom:20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com'}/carrier/accept?job=${job.id}&carrier=${partner.id}"
                   style="display:inline-block;background:#2563eb;color:#fff;font-weight:900;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  Accept this job
                </a>
              </div>
              <p style="font-size:12px;color:#94a3b8;text-align:center;">First to accept wins the job. Exact addresses revealed after acceptance. Payout within 1 week of confirmed delivery.</p>
              <p style="font-size:12px;color:#94a3b8;text-align:center;">Questions: +44 115 661 2825</p>
            </div>
          `,
          text: `New job: ${job.reference}\nCollection: ${pickupArea} → Delivery: ${deliveryDest}\nPayout: ${partnerPayout}\nExpires: ${expiresStr}\n\nAccept at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com'}/carrier/accept?job=${job.id}&carrier=${partner.id}\n\nFirst to accept wins. Payout within 1 week of confirmed delivery.`,
        })
      )
    );

    // Transition job to 'matching'
    await supabase.from('jobs').update({
      status:     'matching',
      matched_at: new Date().toISOString(),
    }).eq('id', job.id);

    // Admin notification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `⚡ ${job.reference} — matching started · ${eligible.length} partner${eligible.length !== 1 ? 's' : ''} alerted`,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;">Job <strong>${job.reference}</strong> moved to matching. <strong>${eligible.length}</strong> partner${eligible.length !== 1 ? 's' : ''} alerted. 20-minute window expires ${expiresStr}.</p>`,
      text: `${job.reference}: matching started. ${eligible.length} partners alerted. Window expires ${expiresStr}.`,
    });

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}

async function notifyOps(from: string, job: Record<string, unknown>, reason: string) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
  await sendResendEmail({
    from,
    to: adminEmail,
    subject: `🚨 ${job.reference} — BootHop Direct required`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;"><h3 style="color:#dc2626;">${job.reference} — BootHop Direct required</h3><p><strong>Reason:</strong> ${reason}</p><p>Pickup: ${job.pickup_address || '—'}<br>Delivery: ${job.delivery_address || '—'}<br>Client: ${job.client_email}</p></div>`,
    text: `${job.reference} — BootHop Direct required.\nReason: ${reason}\nPickup: ${job.pickup_address}\nDelivery: ${job.delivery_address}`,
  });
}
