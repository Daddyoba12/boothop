import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/journeys
 * Returns active trips available for senders to browse.
 * Public — no auth required (same as the web journeys page).
 */
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('trips')
      .select('id, type, from_city, to_city, travel_date, price, weight, status, created_at, email')
      .eq('status', 'active')
      .gte('travel_date', tomorrow.toISOString().split('T')[0])
      .or('auto_created.is.null,auto_created.eq.false')
      .order('travel_date', { ascending: true })
      .limit(100);

    if (error) throw error;

    const journeys = (data ?? []).map((t: any) => ({
      id:                t.id,
      originCity:        t.from_city,
      originCountry:     '',
      destinationCity:   t.to_city,
      destinationCountry:'',
      departureDate:     t.travel_date,
      capacity:          t.weight ? `Up to ${t.weight}kg` : null,
      price:             t.price,
      status:            t.status,
    }));

    return NextResponse.json({ journeys });
  } catch (error) {
    console.error('GET /api/journeys error', error);
    return NextResponse.json({ error: 'Failed to load journeys.' }, { status: 500 });
  }
}
