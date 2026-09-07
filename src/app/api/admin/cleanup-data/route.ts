import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/cleanup-data
 *
 * Removes stale / bad data:
 *   1. Matches in 'matched' status where the trip date has already passed  → mark declined
 *   2. Active trips whose travel_date is in the past                        → mark cancelled
 *   3. Auto-created mirror trips whose match is terminal (declined/cancelled/completed) → delete
 *   4. Matches where the date gap between sender and traveler trips is > 3 days → mark declined + release trips
 *
 * Pass { dryRun: true } in the body to preview without writing anything.
 */
export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const dryRun: boolean = body.dryRun === true;

  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const report: Record<string, unknown> = { dryRun };

  // ── 1. Expired 'matched' matches (trip date in the past) ─────────────────
  const { data: expiredMatches } = await supabase
    .from('matches')
    .select(`id, sender_trip_id, traveler_trip_id,
      sender_trip:sender_trip_id(travel_date, auto_created),
      traveler_trip:traveler_trip_id(travel_date, auto_created)`)
    .eq('status', 'matched');

  const expiredIds: string[] = [];
  for (const m of expiredMatches ?? []) {
    const st = Array.isArray(m.sender_trip)   ? m.sender_trip[0]   : m.sender_trip;
    const tt = Array.isArray(m.traveler_trip) ? m.traveler_trip[0] : m.traveler_trip;
    const tripDate = (st?.travel_date ?? tt?.travel_date ?? '').split('T')[0];
    if (tripDate && tripDate < today) expiredIds.push(m.id);
  }

  report.expired_matched_matches = expiredIds.length;
  if (!dryRun && expiredIds.length) {
    await supabase.from('matches').update({ status: 'declined' }).in('id', expiredIds);
  }

  // ── 2. Active trips with past travel_date ────────────────────────────────
  const { data: pastTrips } = await supabase
    .from('trips')
    .select('id')
    .in('status', ['active', 'pending'])
    .lt('travel_date', today);

  const pastTripIds = (pastTrips ?? []).map((t: any) => t.id);
  report.past_active_trips = pastTripIds.length;
  if (!dryRun && pastTripIds.length) {
    await supabase.from('trips').update({ status: 'cancelled' }).in('id', pastTripIds);
  }

  // ── 3. Orphaned auto-created mirror trips ────────────────────────────────
  const { data: terminalMatches } = await supabase
    .from('matches')
    .select('sender_trip_id, traveler_trip_id')
    .in('status', ['declined', 'cancelled', 'completed', 'blocked']);

  const mirrorTripCandidates: string[] = [];
  for (const m of terminalMatches ?? []) {
    if (m.sender_trip_id)   mirrorTripCandidates.push(m.sender_trip_id);
    if (m.traveler_trip_id) mirrorTripCandidates.push(m.traveler_trip_id);
  }

  let deletedMirrors = 0;
  if (mirrorTripCandidates.length) {
    const { data: mirrorTrips } = await supabase
      .from('trips')
      .select('id')
      .in('id', mirrorTripCandidates)
      .eq('auto_created', true);

    const mirrorIds = (mirrorTrips ?? []).map((t: any) => t.id);
    deletedMirrors = mirrorIds.length;
    report.orphaned_mirror_trips = deletedMirrors;
    if (!dryRun && mirrorIds.length) {
      await supabase.from('trips').delete().in('id', mirrorIds);
    }
  } else {
    report.orphaned_mirror_trips = 0;
  }

  // ── 4. Date-mismatch matches (sender and traveler dates > 3 days apart) ──
  const { data: allPendingMatches } = await supabase
    .from('matches')
    .select(`id, sender_trip_id, traveler_trip_id,
      sender_trip:sender_trip_id(travel_date, auto_created),
      traveler_trip:traveler_trip_id(travel_date, auto_created)`)
    .eq('status', 'matched');

  const dateMismatchIds: string[] = [];
  const releaseTripIds: string[] = [];

  for (const m of allPendingMatches ?? []) {
    const st = Array.isArray(m.sender_trip)   ? m.sender_trip[0]   : m.sender_trip;
    const tt = Array.isArray(m.traveler_trip) ? m.traveler_trip[0] : m.traveler_trip;
    if (!st?.travel_date || !tt?.travel_date) continue;

    const d1 = new Date(st.travel_date).getTime();
    const d2 = new Date(tt.travel_date).getTime();
    const daysDiff = Math.abs(d1 - d2) / 86400000;

    if (daysDiff > 3) {
      dateMismatchIds.push(m.id);
      // Release original (non-auto_created) trips back to active
      if (!st.auto_created && m.sender_trip_id)   releaseTripIds.push(m.sender_trip_id);
      if (!tt.auto_created && m.traveler_trip_id) releaseTripIds.push(m.traveler_trip_id);
    }
  }

  report.date_mismatch_matches = dateMismatchIds.length;
  if (!dryRun && dateMismatchIds.length) {
    await supabase.from('matches').update({ status: 'declined' }).in('id', dateMismatchIds);
    if (releaseTripIds.length) {
      await supabase.from('trips').update({ status: 'active' }).in('id', releaseTripIds);
    }
  }

  return NextResponse.json({ ok: true, ...report });
}
