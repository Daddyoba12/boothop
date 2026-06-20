import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Daily at 11:00 UTC.
// Sends a post-delivery feedback request to Priority Partner clients
// 24 hours after their job is marked delivered.

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const hrs24 = new Date(Date.now() - 24 * 3600000).toISOString();
  const hrs48 = new Date(Date.now() - 48 * 3600000).toISOString();

  // Priority jobs delivered 24–48 hours ago
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, reference, client_email, client_company, pickup_address, delivery_address, delivery_type')
    .eq('client_type', 'priority')
    .eq('status', 'delivered')
    .lte('delivered_at', hrs24)
    .gte('delivered_at', hrs48);

  for (const job of jobs ?? []) {
    await sendResendEmail({
      from,
      to: job.client_email,
      subject: `How was your delivery? — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#d97706;">Boot</span><span style="font-size:20px;font-weight:900;color:#f59e0b;">Hop</span> <span style="font-size:12px;color:#64748b;">Priority Partner</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">How did we do?</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 20px;">${job.reference} · ${job.pickup_address?.split(',').pop()?.trim() || '—'} → ${job.delivery_address?.split(',').pop()?.trim() || '—'}</p>
          <p style="font-size:14px;margin:0 0 20px;">As a Priority Partner, your feedback helps us maintain the service level you expect. This takes 30 seconds.</p>
          <div style="display:flex;gap:8px;margin-bottom:24px;">
            <a href="mailto:feedback@boothop.com?subject=5-STAR-${job.reference}&body=Delivery%20was%20excellent." style="flex:1;display:block;text-align:center;background:#059669;color:#fff;font-weight:700;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;">⭐⭐⭐⭐⭐ Excellent</a>
            <a href="mailto:feedback@boothop.com?subject=FEEDBACK-${job.reference}&body=Feedback%20for%20delivery%20${job.reference}:" style="flex:1;display:block;text-align:center;background:#f1f5f9;color:#0f172a;font-weight:700;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;">💬 Leave feedback</a>
          </div>
          <p style="font-size:13px;color:#64748b;">Or call your account manager directly: <strong>+44 115 661 2825</strong></p>
        </div>
      `,
      text: `How was your delivery? (${job.reference})\n\nEmail us at feedback@boothop.com with subject: 5-STAR-${job.reference} or FEEDBACK-${job.reference}\n\nAccount manager: +44 115 661 2825`,
    });
  }

  return NextResponse.json({ ok: true, sent: jobs?.length ?? 0 });
}
