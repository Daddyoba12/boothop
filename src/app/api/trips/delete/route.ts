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
    // limit(1) matters here. maybeSingle() returns an ERROR, not a row, when the
    // query matches more than one record — verified against PostgREST: 2+ rows
    // gives 406 PGRST116. The error was being discarded, so a trip caught in
    // TWO live matches made this guard return null and the trip was deleted
    // mid-match. Bounding the query means it can only ever see one.
    const { data: liveMatch, error: liveMatchErr } = await supabase
      .from('matches')
      .select('id, status')
      .or(`sender_trip_id.eq.${tripId},traveler_trip_id.eq.${tripId}`)
      .not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
      .limit(1)
      .maybeSingle();

    if (liveMatchErr) {
      console.error('trip delete: live-match check failed', { tripId, error: liveMatchErr });
      return NextResponse.json({ error: 'Could not check this listing right now. Please try again.' }, { status: 500 });
    }

    if (liveMatch) {
      return NextResponse.json(
        { error: 'This trip cannot be deleted while a match is in progress. Cancel the match first.' },
        { status: 409 },
      );
    }

    // The result MUST be checked. matches.sender_trip_id / traveler_trip_id are
    // real foreign keys, so a trip still referenced by a DEAD match (declined,
    // cancelled, completed, blocked) gets past the guard above and is then
    // refused by the database. Unchecked, this returned { ok: true } and the
    // dashboard removed the row from the screen — the listing came straight
    // back on the next refresh.
    const { data: removed, error: deleteErr } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .select('id');

    if (deleteErr || !removed?.length) {
      // Cannot be removed outright, so close it instead. Same result for the
      // user — it stops being a live listing and stops being matched — while
      // the old match keeps a readable record of where the shipment was going.
      if (deleteErr) console.error('trip delete blocked, closing instead', { tripId, error: deleteErr });
      const { error: closeErr } = await supabase
        .from('trips').update({ status: 'cancelled' }).eq('id', tripId);

      if (closeErr) {
        console.error('trip close failed', { tripId, error: closeErr });
        return NextResponse.json({ error: 'Could not remove this listing.' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, closed: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('trip delete error', error);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
