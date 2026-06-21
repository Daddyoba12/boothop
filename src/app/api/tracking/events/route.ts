import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_EVENTS = new Set([
  'collected',
  'at_departure_airport',
  'flight_departed',
  'flight_landed',
  'at_destination',
  'out_for_delivery',
  'delivered',
]);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { matchId, eventType, description, latitude, longitude, photoUrl } = await req.json();

    if (!matchId || !eventType) {
      return NextResponse.json({ error: 'matchId and eventType required' }, { status: 400 });
    }
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select('id, traveler_email')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    if (match.traveler_email !== session.email) {
      return NextResponse.json({ error: 'Only the traveller can log events' }, { status: 403 });
    }

    await supabase.from('tracking_events').insert({
      match_id: matchId,
      event_type: eventType,
      description: description ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      photo_url: photoUrl ?? null,
      recorded_by: 'traveller',
    });

    if (eventType === 'delivered') {
      await Promise.all([
        supabase
          .from('tracking_sessions')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('match_id', matchId),
        supabase
          .from('matches')
          .update({ tracking_status: 'delivered' })
          .eq('id', matchId),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
