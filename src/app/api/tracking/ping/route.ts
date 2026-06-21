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

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { matchId, latitude, longitude, accuracy, speed, heading } = await req.json();

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!matchId || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'matchId, latitude and longitude required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: trackingSession } = await supabase
      .from('tracking_sessions')
      .select('id, status')
      .eq('match_id', matchId)
      .eq('traveller_email', session.email)
      .maybeSingle();

    if (!trackingSession || trackingSession.status !== 'active') {
      return NextResponse.json({ error: 'No active tracking session' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await supabase.from('tracking_points').insert({
      session_id: trackingSession.id,
      match_id: matchId,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy ?? null,
      speed: speed ?? null,
      heading: heading ?? null,
      recorded_at: now,
    });

    await supabase
      .from('tracking_sessions')
      .update({ last_lat: lat, last_lng: lng, last_ping_at: now })
      .eq('id', trackingSession.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
