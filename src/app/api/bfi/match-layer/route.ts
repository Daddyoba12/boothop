import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Maps airport IATA codes to city names used in the BootHop trips table
const AIRPORT_CITY: Record<string, string[]> = {
  LHR: ['London', 'United Kingdom'],
  LGW: ['London', 'United Kingdom'],
  STN: ['London', 'United Kingdom'],
  LTN: ['London', 'United Kingdom'],
  LCY: ['London', 'United Kingdom'],
  LOS: ['Lagos', 'Nigeria'],
  KGL: ['Kigali', 'Rwanda'],
  ABV: ['Abuja', 'Nigeria'],
  ACC: ['Accra', 'Ghana'],
};

// GET /api/bfi/match-layer?origin=LHR&destination=LOS
// Returns count of active BootHop trips on this route — powers the Sprint 3 match layer
// shown on public route pages.
export async function GET(request: Request) {
  const url  = new URL(request.url);
  const orig = url.searchParams.get('origin')?.toUpperCase();
  const dest = url.searchParams.get('destination')?.toUpperCase();

  if (!orig || !dest) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
  }

  const originCities = AIRPORT_CITY[orig]  ?? [orig];
  const destCities   = AIRPORT_CITY[dest]  ?? [dest];
  const originCity   = originCities[0];
  const destCity     = destCities[0];

  const db = createSupabaseAdminClient();

  // Look for active trips where booter is travelling from origin city to dest city
  // within the next 30 days. We only count — never expose personal data.
  const in30Days = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const now      = new Date().toISOString();

  const { count: travelerCount } = await db
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .ilike('origin_city',      `%${originCity}%`)
    .ilike('destination_city', `%${destCity}%`)
    .gte('departure_date',     now)
    .lte('departure_date',     in30Days)
    .in('status', ['active', 'matched', 'available']);

  // Look for senders who need delivery on this route
  const { count: senderCount } = await db
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .ilike('origin_city',      `%${destCity}%`)   // sender is at destination, needs return
    .ilike('destination_city', `%${originCity}%`)
    .gte('departure_date',     now)
    .lte('departure_date',     in30Days)
    .in('status', ['active', 'matched', 'available']);

  return NextResponse.json({
    origin:        orig,
    destination:   dest,
    originCity,
    destCity,
    travelers:     travelerCount ?? 0,
    senders:       senderCount   ?? 0,
    hasActivity:   (travelerCount ?? 0) > 0 || (senderCount ?? 0) > 0,
  });
}
