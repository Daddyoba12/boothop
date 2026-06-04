import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getStripe, calculateFees } from '@/lib/stripe';
import { Resend } from 'resend';
import { sendRatingRequestEmail } from '@/lib/email/sendRatingEmail';

// Captures escrowed Stripe funds and transfers the traveler's share to their
// Connect account for any delivery_confirmed match that has been waiting >24h.
// Skips matches with an open dispute — those need manual admin resolution.

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
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return runAutoPayout();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return runAutoPayout();
}

async function runAutoPayout() {
  const supabase = createSupabaseAdminClient();
  const stripe   = getStripe();
  const resend   = new Resend(process.env.RESEND_API_KEY);

  const cutoff = new Date(Date.now() - RELEASE_AFTER_HOURS * 3_600_000).toISOString();

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, status, agreed_price, sender_email, traveler_email,
      updated_at, payment_session_id, traveler_id,
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

  // Batch-fetch all open disputes for these matches in one query
  const matchIds = matches.map(m => m.id);
  const { data: openDisputes } = await supabase
    .from('disputes')
    .select('match_id')
    .in('match_id', matchIds)
    .eq('status', 'open');

  const disputedMatchIds = new Set((openDisputes ?? []).map((d: any) => d.match_id));

  const released:        string[] = [];
  const failed:          string[] = [];
  const skippedDispute:  string[] = [];

  for (const match of matches) {
    // Hold funds — admin must resolve the dispute first
    if (disputedMatchIds.has(match.id)) {
      skippedDispute.push(match.id);
      continue;
    }

    try {
      const agreedPrice = (match as any).agreed_price ?? 0;

      // ── Step 1: Capture the held payment intent ──────────────────────────
      if ((match as any).payment_session_id) {
        const session = await stripe.checkout.sessions.retrieve(
          (match as any).payment_session_id,
          { expand: ['payment_intent'] }
        );

        const pi = session.payment_intent as any;

        if (pi?.id && pi?.status === 'requires_capture') {
          await stripe.paymentIntents.capture(pi.id);
        }

        // ── Step 2: Transfer traveler's share to their Connect account ─────
        if (agreedPrice > 0 && (match as any).traveler_id) {
          const { data: travelerUser } = await supabase
            .from('users')
            .select('stripe_connect_id')
            .eq('id', (match as any).traveler_id)
            .maybeSingle();

          if (travelerUser?.stripe_connect_id) {
            const { booterReceives } = calculateFees(agreedPrice);
            await stripe.transfers.create({
              amount:      Math.round(booterReceives * 100), // pence
              currency:    'gbp',
              destination: travelerUser.stripe_connect_id,
              metadata:    { match_id: match.id },
            });
          } else {
            // Traveler hasn't completed Connect onboarding — funds stay on
            // platform until they do. Log so admin can follow up.
            console.warn(`auto-payout: traveler ${(match as any).traveler_id} has no stripe_connect_id — funds held on platform for match ${match.id}`);
          }
        }
      }

      // ── Step 3: Mark match completed ─────────────────────────────────────
      let updateErr = (await supabase
        .from('matches')
        .update({ status: 'completed', payment_released_at: new Date().toISOString() })
        .eq('id', match.id)).error;

      if (updateErr?.message?.includes('column') || updateErr?.code === 'PGRST204') {
        const fallback = await supabase
          .from('matches')
          .update({ status: 'completed' })
          .eq('id', match.id);
        updateErr = fallback.error;
      }

      if (updateErr) {
        console.error(`auto-payout update failed for match ${match.id}`, updateErr);
        failed.push(match.id);
        continue;
      }

      // ── Step 4: Send rating request emails ───────────────────────────────
      const tripRaw  = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
      const trip     = tripRaw as { from_city: string; to_city: string } | null | undefined;
      const fromCity = trip?.from_city ?? '';
      const toCity   = trip?.to_city   ?? '';

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

  // ── Notify admin ──────────────────────────────────────────────────────────
  if (released.length > 0 || skippedDispute.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    await resend.emails.send({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      adminEmail,
      subject: `Auto-payout: ${released.length} released${skippedDispute.length ? `, ${skippedDispute.length} held for dispute` : ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
          <div style="margin-bottom:24px;">
            <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span>
            <span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          </div>
          <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">💸 Auto-payout run</h2>

          ${released.length ? `
          <p style="font-size:15px;color:#475569;margin:0 0 8px;">
            <strong>${released.length}</strong> match${released.length > 1 ? 'es' : ''} captured &amp; transferred after ${RELEASE_AFTER_HOURS}h:
          </p>
          <ul style="font-size:14px;color:#334155;margin:0 0 16px;padding-left:20px;">
            ${released.map(id => `<li style="margin-bottom:6px;"><a href="${appUrl}/admin?matchId=${id}" style="color:#2563eb;">${id}</a></li>`).join('')}
          </ul>` : ''}

          ${skippedDispute.length ? `
          <p style="font-size:15px;color:#d97706;margin:0 0 8px;">
            ⚠️ <strong>${skippedDispute.length}</strong> match${skippedDispute.length > 1 ? 'es' : ''} held — open dispute requires manual resolution:
          </p>
          <ul style="font-size:14px;color:#92400e;margin:0 0 16px;padding-left:20px;">
            ${skippedDispute.map(id => `<li style="margin-bottom:6px;"><a href="${appUrl}/admin?matchId=${id}" style="color:#d97706;">${id}</a></li>`).join('')}
          </ul>` : ''}

          ${failed.length ? `<p style="font-size:14px;color:#dc2626;">❌ ${failed.length} failed: ${failed.join(', ')}</p>` : ''}

          <a href="${appUrl}/admin/hub" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
            View admin hub →
          </a>
        </div>
      `,
      text: `Auto-payout: ${released.length} released, ${skippedDispute.length} held for dispute. ${failed.length ? `Failed: ${failed.join(', ')}` : ''}`,
    }).catch(e => console.error('auto-payout admin notify failed', e));
  }

  return NextResponse.json({
    released:           released.length,
    releasedIds:        released,
    skippedDispute:     skippedDispute.length,
    skippedDisputeIds:  skippedDispute,
    failed:             failed.length,
    failedIds:          failed,
    checkedMatches:     matches.length,
  });
}
