import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendFollowUpUnmatchedEmail } from '@/lib/email/sendFollowUpEmail';

// Runs daily (e.g. 10:00 AM UTC via Vercel Cron or external scheduler).
// Finds trips whose travel_date was YESTERDAY, have no match, and emails the owner.
// Using travel_date = yesterday means each expired trip is processed exactly once
// (assuming the cron runs once per day).

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
  return runFollowUp();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runFollowUp();
}

async function runFollowUp() {
  const supabase = createSupabaseAdminClient();

  // Yesterday's date string e.g. "2026-04-14"
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  // Trips whose travel date was yesterday (just expired)
  const { data: expiredTrips, error: tripErr } = await supabase
    .from('trips')
    .select('id, email, from_city, to_city, travel_date, type')
    .eq('travel_date', yesterday)
    .or('status.eq.active,status.is.null');

  if (tripErr) {
    console.error('follow-up-unmatched: trip query error', tripErr);
    return NextResponse.json({ error: tripErr.message }, { status: 500 });
  }

  if (!expiredTrips?.length) {
    return NextResponse.json({ sent: 0, message: 'No expired unmatched trips yesterday.' });
  }

  const tripIds = expiredTrips.map(t => t.id);

  // Find which of these trips already have a match (any non-cancelled status)
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('sender_trip_id, traveler_trip_id')
    .neq('status', 'cancelled')
    .or(
      `sender_trip_id.in.(${tripIds.map(id => `"${id}"`).join(',')}),` +
      `traveler_trip_id.in.(${tripIds.map(id => `"${id}"`).join(',')})`
    );

  const matchedTripIds = new Set<string>();
  for (const m of existingMatches ?? []) {
    if (m.sender_trip_id)   matchedTripIds.add(m.sender_trip_id);
    if (m.traveler_trip_id) matchedTripIds.add(m.traveler_trip_id);
  }

  // Unmatched trips = expired trips not in any active match
  const unmatched = expiredTrips.filter(t => !matchedTripIds.has(t.id));

  if (!unmatched.length) {
    return NextResponse.json({ sent: 0, message: 'All expired trips already matched.' });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const trip of unmatched) {
    if (!trip.email) continue;
    try {
      await sendFollowUpUnmatchedEmail({
        toEmail:    trip.email,
        fromCity:   trip.from_city,
        toCity:     trip.to_city,
        travelDate: trip.travel_date,
        type:       trip.type as 'send' | 'travel',
      });
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${trip.email}: ${msg}`);
      console.error('follow-up email error', trip.email, msg);
    }
  }

  return NextResponse.json({
    sent,
    total:   unmatched.length,
    matched: matchedTripIds.size,
    ...(errors.length ? { errors } : {}),
  });
}
