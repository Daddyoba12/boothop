import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = await request.json();
    if (!tripId) {
      return NextResponse.json({ error: 'tripId required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('id, email, status')
      .eq('id', tripId)
      .eq('email', session.email)
      .maybeSingle();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or not yours' }, { status: 404 });
    }

    // Block deletion if the trip has any match that is not in a terminal state.
    // Terminal = cancelled, declined, blocked, completed (match is fully dead).
    // Everything else (agreed, committed, kyc_pending, kyc_complete,
    // payment_processing, active, delivery_confirmed, disputed,
    // cancellation_requested, matched) keeps the trip locked.
    const TERMINAL_STATUSES = ['cancelled', 'declined', 'blocked', 'completed'];
    const { data: liveMatch } = await supabase
      .from('matches')
      .select('id, status')
      .or(`sender_trip_id.eq.${tripId},traveler_trip_id.eq.${tripId}`)
      .not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
      .maybeSingle();

    if (liveMatch) {
      return NextResponse.json(
        { error: 'This trip cannot be deleted while a match is in progress. Cancel the match first.' },
        { status: 409 },
      );
    }

    await supabase.from('trips').delete().eq('id', tripId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('trip delete error', error);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
