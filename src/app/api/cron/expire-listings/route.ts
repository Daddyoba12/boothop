import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Daily listing cleanup.
 *
 * A listing is removed the day after its own date if it never found a match.
 * Toyi lists on 01/11 to travel 14/11. A sender dated 13/11 that never matched
 * is gone on 14/11; a sender dated 15/11 that never matched is gone on 16/11.
 * Applies to senders and travellers alike.
 *
 * "Never found a match" means no match in a live (non-terminal) status. A trip
 * currently engaged in a match is left alone whatever its date says.
 *
 * DELETE vs EXPIRE — matches.sender_trip_id and traveler_trip_id are real
 * foreign keys (matches_sender_trip_id_fkey). Deleting a trip that any match
 * row still points at would be refused by the database, and would destroy that
 * match's record of where the shipment was going. So:
 *
 *   • no match row references it at all  → DELETE, as intended
 *   • only dead matches reference it     → status 'expired' (same effect for
 *                                          matching and the dashboard, but the
 *                                          match history stays readable)
 */

const TERMINAL_MATCH_STATUSES = ['declined', 'cancelled', 'completed', 'compliance_timeout', 'refunded'];

function isAuthorized(request: Request): boolean {
  const auth     = request.headers.get('authorization');
  const adminKey = request.headers.get('x-admin-key');
  return (
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_SECRET
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runExpiry();
}

/** Manual trigger via admin key, same behaviour. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runExpiry();
}

async function runExpiry() {
  const supabase = createSupabaseAdminClient();
  const today    = new Date().toISOString().slice(0, 10);

  // Listings whose own date has passed.
  const { data: staleTrips, error: tripErr } = await supabase
    .from('trips')
    .select('id, email, type, from_city, to_city, travel_date, status, auto_created')
    .lt('travel_date', today);

  if (tripErr) {
    console.error('expire-listings: trip query failed', tripErr);
    return NextResponse.json({ ok: false, error: tripErr.message }, { status: 500 });
  }

  if (!staleTrips?.length) {
    return NextResponse.json({ ok: true, today, deleted: 0, expired: 0, keptEngaged: 0 });
  }

  // Every match referencing any trip, so we can tell "never matched" from
  // "matched once, long dead" from "currently engaged".
  const { data: allMatches, error: matchErr } = await supabase
    .from('matches')
    .select('id, status, sender_trip_id, traveler_trip_id');

  if (matchErr) {
    console.error('expire-listings: match query failed', matchErr);
    return NextResponse.json({ ok: false, error: matchErr.message }, { status: 500 });
  }

  const referenced = new Set<string>();
  const engaged    = new Set<string>();
  for (const m of allMatches ?? []) {
    for (const id of [m.sender_trip_id, m.traveler_trip_id]) {
      if (!id) continue;
      referenced.add(id);
      if (!TERMINAL_MATCH_STATUSES.includes(m.status)) engaged.add(id);
    }
  }

  const toDelete: string[] = [];
  const toExpire: string[] = [];
  let keptEngaged = 0;

  for (const trip of staleTrips) {
    if (engaged.has(trip.id)) { keptEngaged++; continue; }   // live match — leave alone
    if (trip.status === 'expired') continue;                  // already handled
    if (referenced.has(trip.id)) toExpire.push(trip.id);      // FK would block a delete
    else                        toDelete.push(trip.id);
  }

  let deleted = 0;
  let expired = 0;

  if (toDelete.length) {
    const { data, error } = await supabase
      .from('trips').delete().in('id', toDelete).select('id');
    if (error) console.error('expire-listings: delete failed', error);
    deleted = data?.length ?? 0;
  }

  if (toExpire.length) {
    const { data, error } = await supabase
      .from('trips').update({ status: 'expired' }).in('id', toExpire).select('id');
    if (error) console.error('expire-listings: expire failed', error);
    expired = data?.length ?? 0;
  }

  console.log(`expire-listings: ${deleted} deleted, ${expired} expired, ${keptEngaged} kept (live match)`);

  return NextResponse.json({
    ok: true,
    today,
    deleted,
    expired,
    keptEngaged,
    detail: staleTrips
      .filter((t) => toDelete.includes(t.id) || toExpire.includes(t.id))
      .map((t) => ({
        action: toDelete.includes(t.id) ? 'deleted' : 'expired',
        date:   t.travel_date,
        type:   t.type,
        route:  `${t.from_city} -> ${t.to_city}`,
        email:  t.email,
      })),
  });
}
