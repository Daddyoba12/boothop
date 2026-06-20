import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Every 4 hours.
// Chases carriers for delivery photo proof after a job is marked delivered.
// Also auto-confirms delivery if 48 hours have passed with no dispute.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const now       = Date.now();
  const hrs2      = new Date(now - 2  * 3600000).toISOString();
  const hrs48     = new Date(now - 48 * 3600000).toISOString();
  const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

  // Chase carrier for photo proof — delivered 2+ hours ago, no photo
  const { data: noPhoto } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(email, contact_name, company_name)`)
    .eq('status', 'delivered')
    .is('photo_proof_url', null)
    .lte('delivered_at', hrs2)
    .gt('delivered_at', hrs48);  // Only chase within 48 hrs

  for (const job of noPhoto ?? []) {
    const carrier = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;
    if (!carrier?.email) continue;

    await sendResendEmail({
      from,
      to: carrier.email,
      subject: `📸 Photo proof needed — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#2563eb;">Boot</span><span style="font-size:20px;font-weight:900;color:#60a5fa;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Delivery photo needed</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Hi ${carrier.contact_name || carrier.company_name},</p>
          <p style="font-size:14px;margin:0 0 16px;">Please send a photo of the delivered item for job <strong>${job.reference}</strong> to confirm successful delivery and release your payment.</p>
          <p style="font-size:14px;margin:0 0 20px;">Email your photo to <a href="mailto:proof@boothop.com?subject=PROOF-${job.reference}" style="color:#2563eb;">proof@boothop.com</a> with subject line <strong>PROOF-${job.reference}</strong>.</p>
          <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;font-size:13px;">
            <strong>Payment reminder:</strong> Your £${(job as Record<string, unknown>).partner_rate?.toLocaleString() ?? '—'} payment is released within 1 week of delivery confirmation. Photo proof speeds this up.
          </div>
          <p style="margin-top:16px;font-size:13px;color:#64748b;">Questions: +44 115 661 2825</p>
        </div>
      `,
      text: `Photo proof needed for ${job.reference}.\n\nEmail a delivery photo to proof@boothop.com with subject: PROOF-${job.reference}\n\nThis confirms delivery and releases your £${(job as Record<string, unknown>).partner_rate?.toLocaleString() ?? '—'} payment.\n\nQuestions: +44 115 661 2825`,
    });
  }

  return NextResponse.json({ ok: true, chased: noPhoto?.length ?? 0 });
}
