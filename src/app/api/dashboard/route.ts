import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/dashboard
 * Returns the authenticated user's trips and matches using the admin client
 * so RLS never blocks the response.
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const email = session.email;
    const supabase = createSupabaseAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Fetch user trips — exclude auto-created mirror trips (created by express-interest)
    const { data: trips } = await supabase
      .from('trips')
      .select('id, type, from_city, to_city, travel_date, price, weight, status, created_at')
      .eq('email', email)
      .or('auto_created.is.null,auto_created.eq.false')
      .order('created_at', { ascending: false });

    // Active trips = future-dated, status active
    const activeTrips = (trips || []).filter(
      (t) => t.status === 'active' && t.travel_date >= today
    );

    // Fetch matches where user is sender or traveler.
    // Exclude awaiting_authorisation — admin-only status users shouldn't see.
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, status, agreed_price, offered_price, proposed_price, negotiation_status, created_at,
        sender_email, traveler_email,
        sender_trip:sender_trip_id(from_city, to_city, travel_date, price, weight, auto_created),
        traveler_trip:traveler_trip_id(from_city, to_city, travel_date, price, weight, auto_created)
      `)
      .or(`sender_email.eq.${email},traveler_email.eq.${email}`)
      .neq('status', 'awaiting_authorisation')
      .order('created_at', { ascending: false });

    if (matchesError) console.error('dashboard matches query error', matchesError);

    const allMatches = matches || [];
    const activeMatches = allMatches.filter(
      (m) => !['cancelled', 'declined', 'completed'].includes(m.status)
    );

    // For periodic background sync — count matches in 'matched' state (new, unactioned)
    const isBackground = new URL(req.url).searchParams.get('background') === '1';
    if (isBackground) {
      return NextResponse.json({
        newMatchCount: allMatches.filter((m) => m.status === 'matched').length,
      });
    }

    return NextResponse.json({
      trips: trips || [],
      activeTrips,
      matches: allMatches,
      hasActiveListings: activeTrips.length > 0,
      hasActiveMatches: activeMatches.length > 0,
    });
  } catch (error) {
    console.error('dashboard API error', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
