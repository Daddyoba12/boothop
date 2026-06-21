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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { matchId } = await params;
    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select(`
        id, sender_email, traveler_email, tracking_status, status, agreed_price,
        sender_trip:sender_trip_id(from_city, to_city, travel_date),
        traveler_trip:traveler_trip_id(from_city, to_city, travel_date)
      `)
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const isSender = match.sender_email === session.email;
    const isTraveller = match.traveler_email === session.email;

    if (!isSender && !isTraveller) {
      return NextResponse.json({ error: 'Not authorized for this match' }, { status: 403 });
    }

    const senderTrip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
    const travelerTrip = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
    const displayTrip = senderTrip || travelerTrip;

    const [sessionRes, pointsRes, eventsRes] = await Promise.all([
      supabase
        .from('tracking_sessions')
        .select('id, status, consent_given_at, started_at, ended_at, last_lat, last_lng, last_ping_at')
        .eq('match_id', matchId)
        .maybeSingle(),
      supabase
        .from('tracking_points')
        .select('latitude, longitude, accuracy, recorded_at')
        .eq('match_id', matchId)
        .order('recorded_at', { ascending: true })
        .limit(100),
      supabase
        .from('tracking_events')
        .select('id, event_type, description, latitude, longitude, photo_url, recorded_by, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true }),
    ]);

    return NextResponse.json({
      success: true,
      viewerRole: isSender ? 'sender' : 'traveller',
      match: {
        id: match.id,
        status: match.status,
        trackingStatus: match.tracking_status,
        agreedPrice: match.agreed_price,
        fromCity: displayTrip?.from_city ?? '',
        toCity: displayTrip?.to_city ?? '',
        travelDate: displayTrip?.travel_date ?? '',
      },
      session: sessionRes.data,
      points: pointsRes.data ?? [],
      events: eventsRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
