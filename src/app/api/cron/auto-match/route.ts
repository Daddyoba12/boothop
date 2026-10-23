import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendMatchConfirmedEmail } from '@/lib/email/sendMatchEmail';
import { sendResendEmail } from '@/lib/resend-client';
import { isAfricanCity } from '@/lib/africanCities';
import { hoursBetween, beforeAgreementDeadline } from '@/lib/matching';

async function createActionToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  action_type: string,
  entity_id: string,
  payload: object,
  hoursValid = 72,
) {
  const expires_at = new Date(Date.now() + hoursValid * 3_600_000).toISOString();
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type, entity_id, payload, expires_at })
    .select('token')
    .single();
  return data?.token as string | undefined;
}

/** Strip country suffix so "London, UK" and "London" both normalise to "london" */
function normalizeCity(city: string): string {
  return (city ?? '').toLowerCase().split(',')[0].trim();
}

/** Prefer the English translation if available, otherwise use the original */
function cityEn(trip: any, field: 'from_city' | 'to_city'): string {
  const enField = field === 'from_city' ? 'from_city_en' : 'to_city_en';
  return trip[enField] || trip[field] || '';
}

/* ── Matching rules ─────────────────────────────────────────────────────────
   The TRAVELLER is the anchor: their flight is booked, so their date is fixed.
   The sender's listed date is NOT material — it may sit either side of the
   flight and the pair is still matchable:

     traveller flies 7 Nov, sender listed 5th or 6th → goods already there
     traveller flies 7 Nov, sender listed 8th or 9th → goods brought forward

   Exactly one thing binds: the connect must happen by 6pm the day before
   travel. There is no proximity window and no minimum lead time.

   A pair therefore matches when all four gates below pass. Score is used only
   to choose the BEST traveller for a sender, never to accept or reject.       */

/** Hard gate. Returns null if the pair may match, or a reason string if not. */
function rejectReason(send: any, travel: any, now = new Date()): string | null {
  // A traveller can never carry for another traveller, and a sender cannot send
  // to a sender. Auto-match already queries the two types separately, so this is
  // belt-and-braces — but the rule is explicit rather than implied by a query.
  if (send.type !== 'send' || travel.type !== 'travel') return 'wrong_trip_types';

  // Never pair someone with their own listing.
  if (send.email && travel.email &&
      send.email.toLowerCase().trim() === travel.email.toLowerCase().trim()) return 'self_match';

  // Same route, both ends.
  if (normalizeCity(cityEn(send, 'from_city')) !== normalizeCity(cityEn(travel, 'from_city')) ||
      normalizeCity(cityEn(send, 'to_city'))   !== normalizeCity(cityEn(travel, 'to_city'))) {
    return 'different_route';
  }

  // The only timing rule: there must still be time to connect before 6pm on the
  // day before travel, in the TRAVELLER's local time at their departure city.
  // The sender's own date is deliberately not consulted.
  if (!beforeAgreementDeadline(travel.travel_date, travel.from_city, now)) {
    return 'past_connect_deadline';
  }

  return null;
}

/**
 * Preference score — used ONLY to pick the best traveller for a sender once
 * rejectReason() has already decided the pair is valid. Never a threshold.
 *
 * Route is not scored here: it is a hard gate, so every pair reaching this
 * function already matches on both cities.
 */
function calcScore(send: any, travel: any): number {
  let score = 0;

  // Closer listed dates are preferred, in either direction — a sender listed
  // for the 6th and one listed for the 8th are equally valid for a flight on
  // the 7th, and both beat one listed for the 20th.
  const gapHours = Math.abs(hoursBetween(send.travel_date, travel.travel_date));
  if (gapHours <= 24)        score += 30;
  else if (gapHours <= 72)   score += 25;
  else if (gapHours <= 168)  score += 20;  // within a week
  else if (gapHours <= 720)  score += 10;  // within a month
  else                       score += 5;

  // Closer asking prices are preferred — less negotiation to do.
  if (send.price && travel.price) {
    const diff = Math.abs(send.price - travel.price) / Math.max(send.price, travel.price);
    if (diff <= 0.2) score += 20;
  }
  return score;
}

function isAuthorized(request: Request): boolean {
  const auth     = request.headers.get('authorization');
  const adminKey = request.headers.get('x-admin-key');
  return (
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_SECRET
  );
}

/* POST — manual trigger via admin key */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Admin-triggered: include today's trips
  return runAutoMatch({ includeTodayTrips: true });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runAutoMatch({ includeTodayTrips: false });
}

async function runAutoMatch({ includeTodayTrips = false }: { includeTodayTrips?: boolean } = {}) {

  const supabase = createSupabaseAdminClient();

  const cutoff = new Date();
  if (!includeTodayTrips) cutoff.setDate(cutoff.getDate() + 1);
  const tomorrowStr = cutoff.toISOString().split('T')[0];

  /* Fetch all future trips — active or NULL status (old trips before status field existed).
     .not('in') silently drops NULLs in PostgreSQL so we use .or() instead. */
  const [{ data: senders, error: sendErr }, { data: travellers, error: travErr }] = await Promise.all([
    supabase.from('trips').select('*').eq('type', 'send').or('status.eq.active,status.is.null').gte('travel_date', tomorrowStr),
    supabase.from('trips').select('*').eq('type', 'travel').or('status.eq.active,status.is.null').gte('travel_date', tomorrowStr),
  ]);

  if (sendErr || travErr) {
    return NextResponse.json({ ok: false, error: sendErr?.message ?? travErr?.message });
  }

  if (!senders?.length || !travellers?.length) {
    return NextResponse.json({
      ok: true, matched: 0, message: 'Not enough trips to match.',
      debug: {
        senders:    senders?.length ?? 0,
        travellers: travellers?.length ?? 0,
        senderCities:    senders?.map(s => `${s.from_city} → ${s.to_city} (${s.travel_date}) status:${s.status}`),
        travellerCities: travellers?.map(t => `${t.from_city} → ${t.to_city} (${t.travel_date}) status:${t.status}`),
      },
    });
  }

  /* Fetch existing matches to avoid duplicates */
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('sender_trip_id, traveler_trip_id');

  const alreadyMatched = new Set<string>(
    (existingMatches ?? []).map((m: any) => `${m.sender_trip_id}__${m.traveler_trip_id}`)
  );

  /* Trips that already carry an open (non-terminal) match must not be matched again.
     The DB lock below (trips.status = 'pending') is not enough on its own: this run
     holds `senders`/`travellers` in memory, so a trip matched on one iteration is
     still 'active' in those arrays on the next one. */
  // Statuses that mean the match is over and both trips are free to match again.
  // 'blocked' (fraud) and 'disputed' (live dispute) are deliberately NOT here —
  // those trips stay locked. Everything mid-flow (agreed, committed, kyc_pending,
  // payment_processing, active, delivery_confirmed, …) also keeps its trips locked.
  const TERMINAL_MATCH_STATUSES = ['declined', 'cancelled', 'completed', 'compliance_timeout', 'refunded'];
  const { data: openMatches } = await supabase
    .from('matches')
    .select('sender_trip_id, traveler_trip_id')
    .not('status', 'in', `(${TERMINAL_MATCH_STATUSES.join(',')})`);

  const tripsWithOpenMatch = new Set<string>(
    (openMatches ?? [])
      .flatMap((m) => [m.sender_trip_id, m.traveler_trip_id])
      .filter((id): id is string => Boolean(id))
  );

  const created: string[] = [];
  const skipped: object[] = [];

  for (const send of senders) {
    // Gather every traveller this sender could legitimately go with, then take
    // the best one. Iterating and taking the first match would hand the sender
    // whichever traveller happened to come back first from the database.
    const candidates: { travel: any; score: number }[] = [];

    for (const travel of travellers) {
      const pairKey = `${send.id}__${travel.id}`;
      if (alreadyMatched.has(pairKey)) {
        skipped.push({ reason: 'already_matched', send: send.from_city, travel: travel.from_city });
        continue;
      }

      // Hard gates: trip types, self-match, same route, connect deadline.
      const reject = rejectReason(send, travel);
      if (reject) {
        skipped.push({
          reason: reject,
          send: `${send.from_city}->${send.to_city} ${send.travel_date}`,
          travel: `${travel.from_city}->${travel.to_city} ${travel.travel_date}`,
        });
        continue;
      }

      // One open match per trip — skip if either side is already spoken for.
      if (tripsWithOpenMatch.has(send.id) || tripsWithOpenMatch.has(travel.id)) {
        skipped.push({
          reason: 'trip_already_has_open_match',
          send: send.from_city, travel: travel.from_city,
          sendLocked: tripsWithOpenMatch.has(send.id), travelLocked: tripsWithOpenMatch.has(travel.id),
        });
        continue;
      }

      candidates.push({ travel, score: calcScore(send, travel) });
    }

    if (candidates.length) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      const travel = best.travel;
      const score  = best.score;

      if (candidates.length > 1) {
        skipped.push({
          reason: 'not_best_candidate',
          send: `${send.from_city}->${send.to_city} ${send.travel_date}`,
          chose: `${travel.email} flying ${travel.travel_date} (score ${score})`,
          over: candidates.slice(1).map(c => `${c.travel.email} flying ${c.travel.travel_date} (score ${c.score})`),
        });
      }

      const rawPrice = (send.price && travel.price)
        ? Math.round(((send.price + travel.price) / 2) * 100) / 100
        : send.price ?? travel.price ?? null;
      // Never store null — default to 0 so emails always show a real number
      const agreedPrice = rawPrice ?? 0;

      const { data: matchRecord, error: matchErr } = await supabase
        .from('matches')
        .insert({
          sender_trip_id:   send.id,
          traveler_trip_id: travel.id,
          sender_email:     send.email    ?? null,
          traveler_email:   travel.email  ?? null,
          sender_user_id:   send.user_id  ?? null,
          traveler_user_id: travel.user_id ?? null,
          status:           'matched',
          agreed_price:     agreedPrice,
          interest_type:    'full_price',
        })
        .select('id')
        .single();

      if (matchErr || !matchRecord) {
        console.error('auto-match insert error', matchErr);
        continue;
      }

      created.push(matchRecord.id);
      alreadyMatched.add(`${send.id}__${travel.id}`);
      // Keep the in-memory lock in step with the DB one, so neither trip is
      // paired again later in this same run.
      tripsWithOpenMatch.add(send.id);
      tripsWithOpenMatch.add(travel.id);

      // Lock both trips so no one else can match with them
      await Promise.all([
        supabase.from('trips').update({ status: 'pending' }).eq('id', send.id),
        supabase.from('trips').update({ status: 'pending' }).eq('id', travel.id),
      ]);

      // Notify both parties immediately
      const emailPromises = [];
      for (const [email, role] of [[send.email, 'sender'], [travel.email, 'traveler']] as [string, string][]) {
        if (!email) continue;
        const [acceptToken, declineToken] = await Promise.all([
          createActionToken(supabase, email, 'confirm_match', matchRecord.id, { role }),
          createActionToken(supabase, email, 'decline_match', matchRecord.id, { role }),
        ]);
        emailPromises.push(
          sendMatchConfirmedEmail({
            toEmail:    email,
            fromCity:   send.from_city,
            toCity:     send.to_city,
            travelDate: send.travel_date,
            price:      agreedPrice ?? 0,
            matchId:    matchRecord.id,
            acceptToken,
            declineToken,
          }),
        );
      }
      await Promise.allSettled(emailPromises);

      // Admin FYI for Africa-outbound matches
      const originCity = cityEn(send, 'from_city');
      if (isAfricanCity(originCity)) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
        const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
        sendResendEmail({
          from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
          to:      adminEmail,
          subject: `[FYI] Africa-outbound match created — ${send.from_city} → ${send.to_city}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;color:#0f172a;">
              <div style="margin-bottom:20px;">
                <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              </div>
              <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;">🌍 Africa-outbound match created</h2>
              <p style="font-size:14px;color:#64748b;margin:0 0 20px;">Both parties have been notified. This is for your awareness only — no action required.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
                <tr><td style="padding:8px 0;color:#64748b;width:40%;">Match ID</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${matchRecord.id}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${send.from_city} → ${send.to_city}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Travel date</td><td style="padding:8px 0;color:#0f172a;">${send.travel_date}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Sender</td><td style="padding:8px 0;color:#0f172a;">${send.email ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Carrier</td><td style="padding:8px 0;color:#0f172a;">${travel.email ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Agreed price</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">£${agreedPrice ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Match score</td><td style="padding:8px 0;color:#0f172a;">${score}</td></tr>
              </table>
              <a href="${appUrl}/admin/hub" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
                View in Admin Hub
              </a>
            </div>
          `,
          text: `Africa-outbound match created (FYI).\nRoute: ${send.from_city} → ${send.to_city}\nDate: ${send.travel_date}\nSender: ${send.email}\nCarrier: ${travel.email}\nPrice: £${agreedPrice}\n\nView: ${appUrl}/admin/hub`,
        }).catch(e => console.error('auto-match admin fyi email failed', e));
      }
    }
  }

  /* ── Re-notify orphaned matches (matched status but no action tokens yet) ── */
  const { data: orphans } = await supabase
    .from('matches')
    .select(`
      id, sender_email, traveler_email, agreed_price,
      sender_trip:trips!matches_sender_trip_id_fkey(from_city, to_city, travel_date),
      traveler_trip:trips!matches_traveler_trip_id_fkey(from_city, to_city, travel_date)
    `)
    .eq('status', 'matched');

  const notified: string[] = [];

  for (const orphan of orphans ?? []) {
    // Skip if valid (unused, non-expired) tokens already exist for this match
    const nowCheck = new Date().toISOString();
    const { data: validTokens } = await supabase
      .from('action_tokens')
      .select('id')
      .eq('entity_id', orphan.id)
      .eq('used', false)
      .gte('expires_at', nowCheck)
      .limit(1);

    if (validTokens?.length) continue; // valid tokens exist — reminder cron will handle re-sending

    const senderTrip   = Array.isArray(orphan.sender_trip)   ? orphan.sender_trip[0]   : orphan.sender_trip;
    const travelerTrip = Array.isArray(orphan.traveler_trip) ? orphan.traveler_trip[0] : orphan.traveler_trip;
    const trip         = senderTrip ?? travelerTrip;
    if (!trip) continue;

    const emailPromises = [];
    for (const [email, role] of [[orphan.sender_email, 'sender'], [orphan.traveler_email, 'traveler']] as [string, string][]) {
      if (!email) continue;
      const [acceptToken, declineToken] = await Promise.all([
        createActionToken(supabase, email, 'confirm_match', orphan.id, { role }),
        createActionToken(supabase, email, 'decline_match', orphan.id, { role }),
      ]);
      emailPromises.push(
        sendMatchConfirmedEmail({
          toEmail:      email,
          fromCity:     trip.from_city,
          toCity:       trip.to_city,
          travelDate:   trip.travel_date,
          price:        orphan.agreed_price ?? 0,
          matchId:      orphan.id,
          acceptToken,
          declineToken,
        }),
      );
    }
    await Promise.allSettled(emailPromises);
    notified.push(orphan.id);
  }

  return NextResponse.json({
    ok: true,
    matched: created.length,
    matchIds: created,
    notified,
    skipped,
    debug: {
      senders:    senders.length,
      travellers: travellers.length,
      senderCities:    senders.map(s => `${s.from_city} → ${s.to_city} (${s.travel_date}) status:${s.status}`),
      travellerCities: travellers.map(t => `${t.from_city} → ${t.to_city} (${t.travel_date}) status:${t.status}`),
    },
  });
}
