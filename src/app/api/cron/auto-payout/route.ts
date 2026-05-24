import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { sendRatingRequestEmail } from '@/lib/email/sendRatingEmail';

// Auto-releases payment for delivery_confirmed matches that have been waiting >24h.
// Runs daily. Mirrors what the admin "Release Payment" button does, but automatic.

const RELEASE_AFTER_HOURS = 24;

function isAuthorized(req: Request): boolean {
  const auth     = req.headers.get('authorization');
  const adminKey = req.headers.get('x-admin-key');
  return (
    auth     === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_SECRET
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runAutoPayout();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runAutoPayout();
}

async function runAutoPayout() {
  const supabase = createSupabaseAdminClient();
  const resend   = new Resend(process.env.RESEND_API_KEY);

  const cutoff = new Date(Date.now() - RELEASE_AFTER_HOURS * 3_600_000).toISOString();

  // Find delivery_confirmed matches that have been waiting long enough
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, status, agreed_price, sender_email, traveler_email,
      delivery_confirmed_at, updated_at,
      sender_trip:sender_trip_id(from_city, to_city)
    `)
    .eq('status', 'delivery_confirmed')
    .lt('updated_at', cutoff);

  if (error) {
    console.error('auto-payout query error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!matches?.length) {
    return NextResponse.json({ released: 0, message: 'No delivery_confirmed matches ready for payout.' });
  }

  const released: string[] = [];
  const failed:   string[] = [];

  for (const match of matches) {
    try {
      // Mark as completed
      const { error: updateErr } = await supabase
        .from('matches')
        .update({ status: 'completed', payment_released_at: new Date().toISOString() })
        .eq('id', match.id);

      if (updateErr) {
        console.error(`auto-payout update failed for match ${match.id}`, updateErr);
        failed.push(match.id);
        continue;
      }

      const tripRaw    = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
      const trip       = tripRaw as { from_city: string; to_city: string } | null | undefined;
      const fromCity   = trip?.from_city ?? '';
      const toCity     = trip?.to_city   ?? '';
      const agreedPrice = (match as any).agreed_price ?? 0;

      // Send rating request emails to both parties
      await Promise.allSettled([
        sendRatingRequestEmail({ toEmail: match.sender_email,   fromCity, toCity, matchId: match.id, role: 'sender',   agreedPrice }),
        sendRatingRequestEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId: match.id, role: 'traveler', agreedPrice }),
      ]);

      released.push(match.id);
    } catch (err) {
      console.error(`auto-payout error for match ${match.id}`, err);
      failed.push(match.id);
    }
  }

  // Notify admin of auto-payouts
  if (released.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    await resend.emails.send({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      adminEmail,
      subject: `Auto-payout released ${released.length} match${released.length > 1 ? 'es' : ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          </div>
          <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">💸 Auto-payout completed</h2>
          <p style="font-size:15px;color:#475569;margin:0 0 16px;">
            ${released.length} match${released.length > 1 ? 'es were' : ' was'} auto-released after ${RELEASE_AFTER_HOURS}h in <strong>delivery_confirmed</strong> status.
          </p>
          <ul style="font-size:14px;color:#334155;margin:0 0 24px;padding-left:20px;">
            ${released.map(id => `<li style="margin-bottom:6px;"><a href="${appUrl}/admin?matchId=${id}" style="color:#2563eb;">${id}</a></li>`).join('')}
          </ul>
          ${failed.length ? `<p style="font-size:14px;color:#dc2626;">⚠️ ${failed.length} failed: ${failed.join(', ')}</p>` : ''}
          <a href="${appUrl}/admin/hub" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
            View admin hub →
          </a>
        </div>
      `,
      text: `Auto-payout: ${released.length} match(es) released. IDs: ${released.join(', ')}${failed.length ? `. Failed: ${failed.join(', ')}` : ''}`,
    }).catch(e => console.error('auto-payout admin notify failed', e));
  }

  return NextResponse.json({
    released:       released.length,
    releasedIds:    released,
    failed:         failed.length,
    failedIds:      failed,
    checkedMatches: matches.length,
  });
}
