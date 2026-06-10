import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const url     = new URL(request.url);
    const matchId = url.searchParams.get('matchId');
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, status, locked_at')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Determine thread lock state
    let isLocked = false;
    let lockedSince: string | null = null;
    if (match.locked_at) {
      lockedSince = match.locked_at;
      const ms = Date.now() - new Date(match.locked_at).getTime();
      if (ms >= 7 * 24 * 60 * 60 * 1000) isLocked = true;
    }

    const shipmentId = `BH-${matchId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    const { data: messages } = await supabase
      .from('match_messages')
      .select('id, sender_email, content, is_flagged, is_blocked, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      messages:    messages ?? [],
      shipmentId,
      isLocked,
      lockedSince,
      matchStatus: match.status,
    });

  } catch (error) {
    console.error('messages/list error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
