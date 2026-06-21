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

    await supabase
      .from('tracking_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .eq('traveller_email', session.email);

    await supabase.from('tracking_events').insert({
      match_id: matchId,
      event_type: 'tracking_stopped',
      description: 'Journey tracking ended',
      recorded_by: 'traveller',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
