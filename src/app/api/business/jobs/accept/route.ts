import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

// GET  /api/business/jobs/accept?job=[id]&carrier=[carrier_id]
//      Returns job details for the accept page (carrier must be active)
// POST /api/business/jobs/accept  { job_id, carrier_id }
//      Locks the job, notifies all parties, returns status links

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

function makeStatusToken(jobId: string, action: string) {
  const secret = process.env.JOB_STATUS_SECRET || 'boothop-jobs-secret-2026';
  return createHmac('sha256', secret).update(`${jobId}:${action}`).digest('hex');
}

export async function GET(request: NextRequest) {
  const jobId     = request.nextUrl.searchParams.get('job');
  const carrierId = request.nextUrl.searchParams.get('carrier');

  if (!jobId) return NextResponse.json({ error: 'job parameter required' }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, reference, status, delivery_type, package_size, cargo_description, special_instructions, partner_rate, match_radius_miles, pickup_address, delivery_address, pickup_contact, pickup_phone, delivery_contact, delivery_phone, client_type, created_at')
    .eq('id', jobId)
    .single();

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.status !== 'matching' && job.status !== 'received') {
    return NextResponse.json({ error: 'already_taken', status: job.status }, { status: 409 });
  }

  return NextResponse.json({ job });
}

export async function POST(request: NextRequest) {
  const body      = await request.json();
  const { job_id, carrier_id } = body;

  if (!job_id || !carrier_id) {
    return NextResponse.json({ error: 'job_id and carrier_id required' }, { status: 400 });
  }

  const supabase   = createSupabaseAdminClient();
  const resend     = new Resend(process.env.RESEND_API_KEY);
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  // Fetch job — confirm it's still available
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', job_id)
    .single();

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.status !== 'matching' && job.status !== 'received') {
    return NextResponse.json({ error: 'already_taken' }, { status: 409 });
  }

  // Fetch carrier
  const { data: carrier, error: carrierErr } = await supabase
    .from('carrier_profiles')
    .select('id, email, contact_name, company_name, status, status_active')
    .eq('id', carrier_id)
    .single();

  if (carrierErr || !carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
  if (carrier.status !== 'active' || !carrier.status_active) {
    return NextResponse.json({ error: 'Carrier profile is not active' }, { status: 403 });
  }

  // Lock the job (atomic update — only succeeds if still in matching/received)
  const { error: updateErr } = await supabase
    .from('jobs')
    .update({
      status:      'assigned',
      partner_id:  carrier_id,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', job_id)
    .in('status', ['matching', 'received']);

  if (updateErr) return NextResponse.json({ error: 'Failed to lock job — try again' }, { status: 500 });

  // Log acceptance in match log
  await supabase.from('job_match_log').upsert({
    job_id:      job_id,
    partner_id:  carrier_id,
    response:    'accepted',
    responded_at: new Date().toISOString(),
  }, { onConflict: 'job_id,partner_id' });

  // Update carrier last_job_at
  await supabase.from('carrier_profiles').update({ last_job_at: new Date().toISOString() }).eq('id', carrier_id);

  // Build signed status-update links for the carrier's email
  const collectedUrl   = `${APP_URL}/api/business/jobs/status?job=${job_id}&action=collected&token=${makeStatusToken(job_id, 'collected')}`;
  const inTransitUrl   = `${APP_URL}/api/business/jobs/status?job=${job_id}&action=in_transit&token=${makeStatusToken(job_id, 'in_transit')}`;
  const deliveredUrl   = `${APP_URL}/api/business/jobs/status?job=${job_id}&action=delivered&token=${makeStatusToken(job_id, 'delivered')}`;

  const typeLabel = job.delivery_type === 'uk' ? 'UK' : 'International';

  // ── Carrier: job confirmation with full details ───────────────────────────
  await resend.emails.send({
    from,
    to: carrier.email,
    subject: `✅ Job confirmed — ${job.reference} · £${job.partner_rate?.toLocaleString() ?? '—'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;">
          <span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span>
          <span style="font-size:12px;color:#64748b;margin-left:6px;">Carrier Confirmation</span>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#16a34a;letter-spacing:.05em;">Job confirmed</p>
          <p style="margin:0;font-size:26px;font-weight:900;color:#15803d;font-family:monospace;">${job.reference}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;width:160px;">Your payout</td><td style="padding:8px 0;font-weight:900;font-size:18px;color:#059669;">£${job.partner_rate?.toLocaleString() ?? '—'}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Service type</td><td style="padding:8px 0;font-weight:700;">${typeLabel} Delivery</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Package</td><td style="padding:8px 0;">${job.cargo_description || job.package_size || '—'}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 0;color:#64748b;">Special notes</td><td style="padding:8px 0;">${job.special_instructions || 'None'}</td></tr>
        </table>

        <div style="border:2px solid #2563eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <div style="background:#2563eb;padding:10px 20px;">
            <p style="margin:0;color:#fff;font-weight:700;font-size:13px;">PICKUP</p>
          </div>
          <div style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;">${job.pickup_address || '—'}</p>
            <p style="margin:0;color:#64748b;font-size:13px;">${job.pickup_contact || ''} ${job.pickup_phone ? '· ' + job.pickup_phone : ''}</p>
          </div>
          <div style="background:#f8fafc;padding:10px 20px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#2563eb;font-weight:700;font-size:13px;">DELIVERY</p>
          </div>
          <div style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;">${job.delivery_address || '—'}</p>
            <p style="margin:0;color:#64748b;font-size:13px;">${job.delivery_contact || ''} ${job.delivery_phone ? '· ' + job.delivery_phone : ''}</p>
          </div>
        </div>

        <p style="font-size:14px;font-weight:700;margin:0 0 12px;">Update job progress — tap when each stage is complete:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 8px 4px 0;">
              <a href="${collectedUrl}" style="display:block;background:#0f172a;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;text-align:center;">📦 Collected</a>
            </td>
            <td style="padding:4px 8px 4px 0;">
              <a href="${inTransitUrl}" style="display:block;background:#2563eb;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;text-align:center;">🚛 In transit</a>
            </td>
            <td style="padding:4px 0;">
              <a href="${deliveredUrl}" style="display:block;background:#059669;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;text-align:center;">✅ Delivered</a>
            </td>
          </tr>
        </table>

        <div style="margin-top:20px;background:#fef3c7;border-radius:8px;padding:12px 16px;font-size:13px;">
          <strong>Payment:</strong> £${job.partner_rate?.toLocaleString() ?? '—'} will be transferred to your registered account within <strong>1 week of confirmed delivery</strong>.
        </div>
        <p style="margin-top:20px;font-size:13px;color:#64748b;">Problems? Call ops: <strong>+44 115 661 2825</strong></p>
      </div>
    `,
    text: `Job confirmed: ${job.reference}\nPayout: £${job.partner_rate?.toLocaleString() ?? '—'}\n\nPickup: ${job.pickup_address || '—'}\nContact: ${job.pickup_contact || '—'} ${job.pickup_phone || ''}\n\nDelivery: ${job.delivery_address || '—'}\nContact: ${job.delivery_contact || '—'} ${job.delivery_phone || ''}\n\nUpdate status:\nCollected: ${collectedUrl}\nIn transit: ${inTransitUrl}\nDelivered: ${deliveredUrl}\n\nPayment within 1 week of delivery. Ops: +44 115 661 2825`,
  });

  // ── Admin notification ──────────────────────────────────────────────────
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `✅ ${job.reference} — accepted by ${carrier.company_name} · £${job.partner_rate?.toLocaleString() ?? '—'} payout`,
    html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;"><h3 style="margin:0 0 12px;">${job.reference} — carrier accepted</h3><p style="font-size:14px;"><strong>Carrier:</strong> ${carrier.company_name} (${carrier.email})<br><strong>Payout:</strong> £${job.partner_rate?.toLocaleString() ?? '—'} (within 1 week of delivery)<br><strong>Route:</strong> ${job.pickup_address || '—'} → ${job.delivery_address || '—'}<br><strong>Client:</strong> ${job.client_email}</p></div>`,
    text: `${job.reference} accepted by ${carrier.company_name} (${carrier.email})\nPayout: £${job.partner_rate?.toLocaleString() ?? '—'}\nRoute: ${job.pickup_address} → ${job.delivery_address}`,
  });

  // ── Client: carrier assigned notification ─────────────────────────────
  await resend.emails.send({
    from,
    to: job.client_email,
    subject: `🚛 Carrier assigned — ${job.reference}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop</span></div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;">Your carrier is confirmed.</h2>
        <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A verified BootHop carrier has accepted your booking <strong>${job.reference}</strong> and is on their way to collect.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:20px;font-size:14px;">
          <p style="margin:0 0 8px;font-weight:700;">What to expect:</p>
          <p style="margin:0 0 4px;">1. Carrier collects from your pickup address</p>
          <p style="margin:0 0 4px;">2. You'll receive an email when your shipment is in transit</p>
          <p style="margin:0;">3. You'll receive a final confirmation when delivered</p>
        </div>
        <p style="font-size:13px;color:#64748b;">Questions? Call <strong>+44 115 661 2825</strong> or email <a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a> quoting <strong>${job.reference}</strong>.</p>
      </div>
    `,
    text: `Your carrier is confirmed for ${job.reference}.\n\nThey are on their way to collect. You'll receive updates as the job progresses.\n\nQuestions: +44 115 661 2825 / business@boothop.com (quote ${job.reference})`,
  });

  return NextResponse.json({ ok: true, reference: job.reference });
}
