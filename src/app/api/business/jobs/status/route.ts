import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

// GET /api/business/jobs/status?job=[id]&action=[collected|in_transit|delivered]&token=[hmac]
// Carrier taps this link from their confirmation email to update job status.
// Returns a simple HTML confirmation page — no auth portal needed.

const VALID_ACTIONS = ['collected', 'in_transit', 'delivered'] as const;
type Action = typeof VALID_ACTIONS[number];

const STATUS_MAP: Record<Action, string> = {
  collected:  'collected',
  in_transit: 'in_transit',
  delivered:  'delivered',
};

const TIMESTAMP_MAP: Record<Action, string> = {
  collected:  'collected_at',
  in_transit: 'in_transit_at',
  delivered:  'delivered_at',
};

function verifyToken(jobId: string, action: string, token: string) {
  const secret   = process.env.JOB_STATUS_SECRET || 'boothop-jobs-secret-2026';
  const expected = createHmac('sha256', secret).update(`${jobId}:${action}`).digest('hex').slice(0, 16);
  return expected === token;
}

const html = (title: string, body: string, color: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
           font-family:Arial,sans-serif; background:#020617; color:#fff; padding:24px; text-align:center; gap:16px; }
    .card { background:#0c1a2e; border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:40px 32px; max-width:400px; width:100%; }
    .icon { font-size:48px; margin-bottom:8px; }
    h1 { margin:0 0 8px; font-size:22px; font-weight:900; color:${color}; }
    p { margin:0; color:rgba(255,255,255,.5); font-size:14px; line-height:1.6; }
    .ref { font-family:monospace; color:${color}; font-weight:700; font-size:16px; }
    a { color:${color}; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <p style="margin-top:20px;font-size:12px;">Problems? Call ops: <a href="tel:+441156612825">+44 115 661 2825</a></p>
  </div>
</body>
</html>`;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const jobId  = params.get('job');
  const action = params.get('action') as Action | null;
  const token  = params.get('token');

  if (!jobId || !action || !token) {
    return new NextResponse(html('Error', '<div class="icon">❌</div><h1>Invalid link</h1><p>This link is missing required parameters.</p>', '#ef4444'), { headers: { 'Content-Type': 'text/html' } });
  }

  if (!VALID_ACTIONS.includes(action)) {
    return new NextResponse(html('Error', '<div class="icon">❌</div><h1>Unknown action</h1><p>This update type is not recognised.</p>', '#ef4444'), { headers: { 'Content-Type': 'text/html' } });
  }

  if (!verifyToken(jobId, action, token)) {
    return new NextResponse(html('Error', '<div class="icon">🔒</div><h1>Invalid link</h1><p>This link is expired or has been tampered with. Contact ops.</p>', '#ef4444'), { headers: { 'Content-Type': 'text/html' } });
  }

  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  // Fetch job
  const { data: job } = await supabase
    .from('jobs')
    .select('id, reference, status, client_email, client_type, partner_rate, pickup_address, delivery_address')
    .eq('id', jobId)
    .single();

  if (!job) {
    return new NextResponse(html('Error', '<div class="icon">❌</div><h1>Job not found</h1><p>Contact ops: +44 115 661 2825</p>', '#ef4444'), { headers: { 'Content-Type': 'text/html' } });
  }

  // Check order: can't go backwards
  const ORDER: string[] = ['assigned', 'collected', 'in_transit', 'delivered'];
  const currentIdx = ORDER.indexOf(job.status);
  const actionIdx  = ORDER.indexOf(STATUS_MAP[action]);
  if (actionIdx <= currentIdx) {
    return new NextResponse(html('Already updated', `<div class="icon">✅</div><h1>Already recorded</h1><p>Job <span class="ref">${job.reference}</span> is already at <strong>${job.status.replace('_', ' ')}</strong> or later.</p>`, '#10b981'), { headers: { 'Content-Type': 'text/html' } });
  }

  // Update job status
  const updatePayload: Record<string, unknown> = {
    status: STATUS_MAP[action],
    [TIMESTAMP_MAP[action]]: new Date().toISOString(),
  };

  // Set payment_due_at when delivered
  if (action === 'delivered') {
    updatePayload.payment_due_at = new Date(Date.now() + 7 * 86400000).toISOString();
  }

  await supabase.from('jobs').update(updatePayload).eq('id', jobId);

  // Notify admin
  const actionLabels: Record<Action, string> = {
    collected:  '📦 Collected',
    in_transit: '🚛 In transit',
    delivered:  '✅ Delivered',
  };
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `${actionLabels[action]} — ${job.reference}`,
    text: `${job.reference}: ${action.replace('_', ' ')} at ${new Date().toLocaleTimeString('en-GB')}.\nClient: ${job.client_email}\nRoute: ${job.pickup_address || '—'} → ${job.delivery_address || '—'}`,
  });

  // Notify client on delivery
  if (action === 'delivered') {
    await resend.emails.send({
      from,
      to: job.client_email,
      subject: `✅ Delivered — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:16px;"><span style="font-size:18px;font-weight:900;color:#059669;">Boot</span><span style="font-size:18px;font-weight:900;color:#10b981;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Your delivery is complete.</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Job <strong>${job.reference}</strong> has been delivered. If you have any questions, contact us quoting your reference number.</p>
          <p style="font-size:14px;font-weight:700;">+44 115 661 2825 · <a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a></p>
        </div>
      `,
      text: `Your delivery is complete.\n\nReference: ${job.reference}\n\nThank you for using BootHop.\n\n+44 115 661 2825 / business@boothop.com`,
    });
  }

  const messages: Record<Action, { icon: string; title: string; body: string }> = {
    collected:  { icon: '📦', title: 'Collected — thank you', body: `Job <span class="ref">${job.reference}</span> marked as collected. Tap <strong>In transit</strong> when you set off.` },
    in_transit: { icon: '🚛', title: "You're on your way", body: `Job <span class="ref">${job.reference}</span> is now in transit. Tap <strong>Delivered</strong> when the shipment is handed over.` },
    delivered:  { icon: '✅', title: 'Delivered — job complete', body: `Job <span class="ref">${job.reference}</span> is complete. Your payment of <strong>£${job.partner_rate?.toLocaleString() ?? '—'}</strong> will be transferred within 1 week.` },
  };

  const msg = messages[action];
  return new NextResponse(
    html(msg.title, `<div class="icon">${msg.icon}</div><h1>${msg.title}</h1><p>${msg.body}</p>`, action === 'delivered' ? '#10b981' : '#60a5fa'),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
