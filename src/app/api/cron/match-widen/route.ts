import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

// Called every 5 minutes by Vercel Cron.
// Widens match radius for unaccepted jobs:
//   +10 min: 50 → 75 miles
//   +15 min: 75 → 100 miles
//   +20 min: 100 → BootHop Direct fallback + ops alert

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const from     = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';

  const now = new Date();
  const mins = (n: number) => new Date(now.getTime() - n * 60 * 1000).toISOString();

  // Jobs waiting 20+ minutes at any radius → BootHop Direct fallback
  const { data: critical } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'matching')
    .eq('is_boothop_direct', false)
    .lt('matched_at', mins(20));

  for (const job of critical ?? []) {
    await supabase.from('jobs').update({
      status:           'matching',
      is_boothop_direct: true,
    }).eq('id', job.id);

    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `🚨 ${job.reference} — 20 MIN EXCEEDED · BootHop Direct required`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:24px;color:#0f172a;">
          <h2 style="color:#dc2626;margin:0 0 12px;">20-minute window exceeded — BootHop Direct required</h2>
          <p style="font-size:14px;margin:0 0 16px;">Job <strong>${job.reference}</strong> has not been accepted after 20 minutes and has been flagged for BootHop Direct.</p>
          <table style="font-size:14px;border-collapse:collapse;width:100%;">
            <tr><td style="padding:6px 0;color:#64748b;width:150px;">Reference</td><td style="font-weight:700;">${job.reference}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Client</td><td>${job.client_email}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Route</td><td>${job.pickup_address || '—'} → ${job.delivery_address || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Matched at</td><td>${job.matched_at}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Last radius</td><td>${job.match_radius_miles} miles</td></tr>
          </table>
          <p style="margin-top:16px;font-size:13px;background:#fee2e2;border-radius:6px;padding:10px;"><strong>Action:</strong> Arrange BootHop Direct courier immediately. Contact client at <strong>${job.client_email}</strong> to confirm.</p>
        </div>
      `,
      text: `BOOTHOP DIRECT REQUIRED — ${job.reference}\nClient: ${job.client_email}\nRoute: ${job.pickup_address} → ${job.delivery_address}\n20-minute window exceeded. Arrange BootHop Direct now.`,
    });
  }

  // Jobs waiting 15–20 minutes at 75 miles → widen to 100
  const { data: widen100 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'matching')
    .eq('match_radius_miles', 75)
    .eq('is_boothop_direct', false)
    .lt('matched_at', mins(15));

  for (const job of widen100 ?? []) {
    await supabase.from('jobs').update({ match_radius_miles: 100 }).eq('id', job.id);
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `📡 ${job.reference} — radius widened to 100 miles`,
      text: `${job.reference}: No acceptance at 75 miles after 15 min. Widened to 100 miles. 5 minutes remaining before BootHop Direct.`,
    });
  }

  // Jobs waiting 10–15 minutes at 50 miles → widen to 75
  const { data: widen75 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'matching')
    .eq('match_radius_miles', 50)
    .eq('is_boothop_direct', false)
    .lt('matched_at', mins(10));

  for (const job of widen75 ?? []) {
    await supabase.from('jobs').update({ match_radius_miles: 75 }).eq('id', job.id);
    await sendResendEmail({
      from,
      to: adminEmail,
      subject: `📡 ${job.reference} — radius widened to 75 miles`,
      text: `${job.reference}: No acceptance at 50 miles after 10 min. Widened to 75 miles.`,
    });
  }

  return NextResponse.json({
    ok: true,
    boothop_direct: critical?.length ?? 0,
    widened_to_100: widen100?.length ?? 0,
    widened_to_75:  widen75?.length ?? 0,
  });
}
