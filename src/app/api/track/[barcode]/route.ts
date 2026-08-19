import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params;
    if (!barcode) {
      return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Look up by either sender or traveller barcode (no auth — public tracking)
    const { data: match } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        tracking_status,
        updated_at,
        sender_barcode,
        traveller_barcode,
        sender_trip:sender_trip_id(
          from_city,
          to_city,
          origin_country,
          dest_country,
          travel_date
        ),
        traveler_trip:traveler_trip_id(
          from_city,
          to_city,
          origin_country,
          dest_country,
          travel_date
        )
      `)
      .or(`sender_barcode.eq.${barcode},traveller_barcode.eq.${barcode}`)
      .maybeSingle();

    if (!match) {
      return NextResponse.json({ error: 'Tracking number not found' }, { status: 404 });
    }

    const st = match.sender_trip as any;
    const tt = match.traveler_trip as any;

    // Use sender_trip for origin (where the package starts), traveler_trip for destination
    const originCity        = st?.from_city        ?? st?.originCity        ?? tt?.from_city        ?? '—';
    const originCountry     = st?.origin_country   ?? st?.originCountry     ?? tt?.origin_country   ?? '';
    const destinationCity   = st?.to_city          ?? st?.destinationCity   ?? tt?.to_city          ?? '—';
    const destinationCountry= st?.dest_country     ?? st?.destinationCountry ?? tt?.dest_country    ?? '';
    const departureDate     = st?.travel_date      ?? st?.departureDate     ?? tt?.travel_date      ?? null;

    return NextResponse.json({
      matchId:   match.id,
      status:    match.status,
      updatedAt: match.updated_at,
      trip: {
        originCity,
        originCountry,
        departureDate,
      },
      request: {
        destinationCity,
        destinationCountry,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
