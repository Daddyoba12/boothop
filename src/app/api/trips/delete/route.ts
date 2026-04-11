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

    // Block deletion if trip is in an active match
    const LOCKED_STATUSES = ['committed', 'kyc_pending', 'kyc_complete', 'payment_processing', 'active'];
    const { data: activeMatch } = await supabase
      .from('matches')
      .select('id, status')
      .or(`sender_trip_id.eq.${tripId},traveler_trip_id.eq.${tripId}`)
      .in('status', LOCKED_STATUSES)
      .maybeSingle();

    if (activeMatch) {
      return NextResponse.json(
        { error: 'Cannot delete a trip that is part of an active match.' },
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
