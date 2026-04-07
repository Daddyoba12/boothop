import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const from = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

// Auto-cancels matches stuck at agreed/committed if T&C not signed within 12 hours
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase  = createSupabaseAdminClient();
    const resend    = new Resend(process.env.RESEND_API_KEY);
    const cutoff12h = new Date(Date.now() - 12 * 3_600_000).toISOString();
    const cutoff72h = new Date(Date.now() - 72 * 3_600_000).toISOString();

    // Matches stuck at 'agreed' or 'committed' for over 12 hours
    const { data: stuckMatches } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
      .in('status', ['agreed', 'committed'])
      .lt('created_at', cutoff12h);

    // Matches stuck at 'kyc_pending' for over 72 hours
    const { data: stuckKyc } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('status', 'kyc_pending')
      .lt('created_at', cutoff72h);

    const toCancel = [...(stuckMatches ?? []), ...(stuckKyc ?? [])];
    if (!toCancel.length) return NextResponse.json({ cancelled: 0 });

    let cancelled = 0;
    for (const match of toCancel) {
      await supabase
        .from('matches')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Expired — not completed within the required time.' })
        .eq('id', match.id);

      const trip     = (match as any).sender_trip;
      const route    = trip ? `${trip.from_city} → ${trip.to_city}` : 'your delivery';
      const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

      const emails = [match.sender_email, match.traveler_email].filter(Boolean);
      await Promise.allSettled(emails.map(email =>
        resend.emails.send({
          from,
          to: email,
          subject: `Match expired — ${route}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
              <div style="margin-bottom:24px;">
                <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏰ Your match has expired</h2>
              <p style="font-size:15px;color:#475569;margin:0 0 20px;">
                Unfortunately your <strong>${route}</strong> match was cancelled because the required steps were not completed in time.
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 24px;">
                You can post a new trip at any time — we'll find you another match.
              </p>
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
                Back to dashboard →
              </a>
            </div>
          `,
          text: `Your BootHop match for ${route} has expired. Visit ${appUrl}/dashboard to post a new trip.`,
        })
      ));

      cancelled++;
    }

    return NextResponse.json({ cancelled });
  } catch (error) {
    console.error('expire-matches cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
