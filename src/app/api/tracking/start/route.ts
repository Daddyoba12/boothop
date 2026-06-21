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

    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select('id, sender_email, traveler_email')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    if (match.traveler_email !== session.email) {
      return NextResponse.json({ error: 'Only the traveller can start tracking' }, { status: 403 });
    }

    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('tracking_sessions')
      .select('id, status')
      .eq('match_id', matchId)
      .maybeSingle();

    let sessionId: string;

    if (existing) {
      await supabase
        .from('tracking_sessions')
        .update({ status: 'active', started_at: now, consent_given_at: now, ended_at: null })
        .eq('id', existing.id);
      sessionId = existing.id;
    } else {
      const { data: created } = await supabase
        .from('tracking_sessions')
        .insert({
          match_id: matchId,
          traveller_email: session.email,
          sender_email: match.sender_email,
          status: 'active',
          consent_given_at: now,
          started_at: now,
        })
        .select('id')
        .single();
      sessionId = created!.id;
    }

    await supabase.from('tracking_events').insert({
      match_id: matchId,
      event_type: 'tracking_started',
      description: 'Traveller started sharing their journey',
      recorded_by: 'traveller',
    });

    await supabase.from('matches').update({ tracking_status: 'active' }).eq('id', matchId);

    return NextResponse.json({ success: true, sessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
