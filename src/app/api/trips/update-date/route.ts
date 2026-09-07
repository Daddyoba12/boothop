import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { tripId, newDate } = await request.json();
    if (!tripId || !newDate) {
      return NextResponse.json({ error: 'tripId and newDate are required.' }, { status: 400 });
    }

    // Must be at least tomorrow — same-day and past bookings are not allowed
    const parsed = new Date(newDate);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
    }
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (parsed < tomorrow) {
      return NextResponse.json(
        { error: 'Date must be at least tomorrow — same-day bookings are not allowed.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const email = session.email.toLowerCase().trim();

    // Fetch the trip — confirm ownership and that it's still editable
    const { data: trip, error: fetchErr } = await supabase
      .from('trips')
      .select('id, email, status, travel_date')
      .eq('id', tripId)
      .maybeSingle();

    if (fetchErr || !trip) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }
    if (trip.email?.toLowerCase().trim() !== email) {
      return NextResponse.json({ error: 'You can only edit your own listings.' }, { status: 403 });
    }
    if (!['active', 'pending'].includes(trip.status ?? '')) {
      return NextResponse.json(
        { error: 'This listing cannot be edited — it may already be matched or completed.' },
        { status: 400 },
      );
    }

    const dateStr = parsed.toISOString().split('T')[0];

    const { error: updateErr } = await supabase
      .from('trips')
      .update({ travel_date: dateStr, updated_at: new Date().toISOString() })
      .eq('id', tripId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, travel_date: dateStr });
  } catch (err) {
    console.error('trips/update-date error', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
