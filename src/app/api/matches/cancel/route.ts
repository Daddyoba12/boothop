import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

// Statuses where cancellation with no penalty is allowed
const CANCELLABLE_STATUSES = ['matched', 'agreed', 'committed', 'kyc_pending', 'kyc_complete'];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, reason } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (!CANCELLABLE_STATUSES.includes(match.status)) {
      return NextResponse.json({
        error: 'This match cannot be cancelled at this stage. If payment has been made, please contact support.',
      }, { status: 400 });
    }

    await supabase
      .from('matches')
      .update({
        status:           'cancelled',
        cancelled_by:     email,
        cancelled_at:     new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq('id', matchId);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('matches/cancel error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
