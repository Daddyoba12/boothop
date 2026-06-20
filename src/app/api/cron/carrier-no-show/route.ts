import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Every 20 minutes.
// Detects carriers who accepted a job but have gone silent (no-show):
//   No status update after 90 minutes from assignment → no-show protocol.
// Re-opens the job for matching, suspends carrier temporarily, alerts admin.

export async function GET() {
  const supabase   = createSupabaseAdminClient();
  const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const mins90 = new Date(Date.now() - 90 * 60000).toISOString();

  const { data: noShows } = await supabase
    .from('jobs')
    .select(`*, carrier_profiles!partner_id(id, email, contact_name, company_name)`)
    .eq('status', 'assigned')
    .is('collected_at', null)
    .lte('assigned_at', mins90);

  for (const job of noShows ?? []) {
    const carrier = (job as Record<string, unknown>).carrier_profiles as Record<string, string> | null;

    // Suspend carrier temporarily
    if (carrier?.id) {
      await supabase
        .from('carrier_profiles')
        .update({ status_active: false })
        .eq('id', carrier.id);
    }

    // Re-open job for matching
    await supabase
      .from('jobs')
      .update({
        status:      'received',
        partner_id:  null,
        assigned_at: null,
        matched_at:  null,
        match_radius_miles: 50,  // reset radius
      })
      .eq('id', job.id);

    // Alert admin
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `🚨 Carrier no-show — ${job.reference} re-opened · ${carrier?.company_name || 'unknown'}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
          <h3 style="color:#dc2626;">Carrier no-show — job re-opened</h3>
          <table style="font-size:14px;border-collapse:collapse;width:100%;max-width:500px;">
            <tr><td style="padding:6px 0;color:#64748b;width:150px;">Job</td><td style="font-weight:700;">${job.reference}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Carrier</td><td>${carrier?.company_name || '—'} · ${carrier?.email || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Client</td><td>${job.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Pickup</td><td>${job.pickup_address || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Assigned at</td><td>${job.assigned_at}</td></tr>
          </table>
          <div style="margin-top:16px;background:#fee2e2;border-radius:6px;padding:12px 16px;font-size:13px;">
            <strong>Actions taken:</strong><br>
            ✓ Carrier temporarily suspended<br>
            ✓ Job re-opened for matching (radius reset to 50 miles)<br>
            <strong>Action required:</strong> Call client at ${job.client_email} to update them. Consider priority re-match.
          </div>
        </div>
      `,
      text: `No-show: ${carrier?.company_name} for job ${job.reference}.\nCarrier suspended. Job re-opened.\nCall client: ${job.client_email}\nPickup: ${job.pickup_address}`,
    });

    // Alert client
    await sendResendEmail({
      from,
      to: job.client_email,
      subject: `Important update — ${job.reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:20px;"><span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop</span></div>
          <h2 style="font-size:20px;margin:0 0 8px;">Update on your booking</h2>
          <p style="font-size:14px;margin:0 0 16px;">We have encountered an issue with your original carrier for booking <strong>${job.reference}</strong>. Our team is arranging a replacement carrier immediately.</p>
          <p style="font-size:14px;margin:0 0 16px;">We sincerely apologise for this disruption. A member of our team will call you within 15 minutes to confirm the new carrier details.</p>
          <p style="font-size:15px;font-weight:700;">+44 115 661 2825</p>
          <p style="font-size:13px;"><a href="mailto:business@boothop.com" style="color:#059669;">business@boothop.com</a></p>
        </div>
      `,
      text: `We encountered an issue with your carrier for ${job.reference}. We are arranging a replacement immediately. Our team will call you within 15 minutes.\n\n+44 115 661 2825 / business@boothop.com`,
    });
  }

  return NextResponse.json({ ok: true, no_shows: noShows?.length ?? 0 });
}
