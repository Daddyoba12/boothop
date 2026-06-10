import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

// Called when delivery is confirmed — starts the 7-day dispute window.
// After 7 days, send route rejects new messages automatically.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, locked_at')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    if (match.locked_at) {
      return NextResponse.json({ ok: true, alreadyLocked: true, lockedAt: match.locked_at });
    }

    const { error } = await supabase
      .from('matches')
      .update({ locked_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) throw error;

    return NextResponse.json({ ok: true, message: '7-day dispute window started. Thread will archive after 7 days.' });

  } catch (error) {
    console.error('messages/lock error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
