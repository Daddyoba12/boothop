import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { TickerEntry } from '@/lib/bfi/types';

export const revalidate = 1800; // refresh every 30 min

const MARKER = process.env.TRAVELPAYOUTS_MARKER ?? '544322';

const AIRLINE_NAMES: Record<string, string> = {
  AP: 'Air Peace',          WB: 'RwandAir',           AT: 'Royal Air Maroc',
  TK: 'Turkish Airlines',   ET: 'Ethiopian Airlines',  BA: 'British Airways',
  VS: 'Virgin Atlantic',    KQ: 'Kenya Airways',       MS: 'EgyptAir',
  LH: 'Lufthansa',          AF: 'Air France',          KL: 'KLM',
  QR: 'Qatar Airways',      EK: 'Emirates',            EY: 'Etihad Airways',
  W3: 'Arik Air',           DN: 'Dana Air',            '9J': 'Air Nigeria',
};

function airlineName(code: string) { return AIRLINE_NAMES[code] ?? code; }

function aviasalesUrl(origin: string, destination: string, date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const mon = String(date.getMonth() + 1).padStart(2, '0');
  return `https://www.aviasales.com/search/${origin.toUpperCase()}${day}${mon}${destination.toUpperCase()}1?marker=${MARKER}`;
}

function formatDate(dateStr: string): string {
  const d    = new Date(dateStr + 'T12:00:00Z');
  const now  = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (diff <= 0)  return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface BestFlight {
  priceGbp:    number;
  airline:     string;
  depDate:     Date;
  depDateStr:  string;
}

// Calls /v1/prices/cheap and returns the cheapest flight departing in the next `windowDays` days.
// Falls back to overall cheapest in the month if none found this week.
async function cheapestThisWeek(
  origin:      string,
  destination: string,
  windowDays   = 7,
): Promise<BestFlight | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return null;

  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff    = new Date(today.getTime() + windowDays * 86_400_000);
  const thisMonth = today.toISOString().slice(0, 7);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 7);

  // Fetch current month + next month in parallel so early searches next month are covered
  const [r1, r2] = await Promise.all([
    fetchCheap(origin, destination, thisMonth, token),
    fetchCheap(origin, destination, nextMonth, token),
  ]);

  const allFlights = [...(r1 ?? []), ...(r2 ?? [])];
  if (!allFlights.length) return null;

  // Priority 1: cheapest flight departing today→+windowDays
  const thisWeek = allFlights
    .filter(f => f.depDate >= today && f.depDate <= cutoff)
    .sort((a, b) => a.priceGbp - b.priceGbp);

  if (thisWeek.length) return thisWeek[0];

  // Priority 2: cheapest in the month (future dates only)
  const future = allFlights
    .filter(f => f.depDate >= today)
    .sort((a, b) => a.priceGbp - b.priceGbp);

  return future[0] ?? null;
}

async function fetchCheap(
  origin:      string,
  destination: string,
  month:       string,
  token:       string,
): Promise<BestFlight[] | null> {
  try {
    const url = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    url.searchParams.set('origin',      origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('depart_date', month);
    url.searchParams.set('currency',    'gbp');
    url.searchParams.set('token',       token);

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const json  = await res.json();
    const data  = (json.data?.[destination] ?? {}) as Record<string, {
      price: number; depart_date?: string; departure_at?: string;
    }>;

    const flights: BestFlight[] = [];
    for (const [code, f] of Object.entries(data)) {
      const price  = Math.round(f.price ?? 0);
      const rawDate = f.depart_date ?? f.departure_at ?? '';
      if (!price || !rawDate) continue;
      const depDate = new Date(rawDate.slice(0, 10) + 'T12:00:00Z');
      if (isNaN(depDate.getTime())) continue;
      flights.push({ priceGbp: price, airline: airlineName(code), depDate, depDateStr: rawDate.slice(0, 10) });
    }
    return flights;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = new Date().toISOString();
  const db  = createSupabaseAdminClient();

  // Pull enabled routes and airport names straight from the DB — no hardcoding
  const [{ data: dbRoutes }, { data: airports }] = await Promise.all([
    db.from('bfi_routes').select('origin, destination').eq('enabled', true).order('priority', { ascending: false }),
    db.from('bfi_airports').select('code, city'),
  ]);

  const routes = dbRoutes ?? [];
  if (!routes.length) return NextResponse.json({ entries: [], updatedAt: now });

  const cityMap: Record<string, string> = {};
  for (const a of airports ?? []) cityMap[a.code] = a.city;

  // Fetch live prices for all DB routes in parallel
  const results = await Promise.allSettled(
    routes.map(r => cheapestThisWeek(r.origin, r.destination, 7))
  );

  const entries: TickerEntry[] = routes
    .flatMap((r, i) => {
      const live = results[i].status === 'fulfilled' ? results[i].value : null;
      if (!live) return []; // skip routes with no live price data

      const label: string = live.depDateStr ? formatDate(live.depDateStr) : 'This week';

      const entry: TickerEntry = {
        origin:           r.origin,
        destination:      r.destination,
        originCity:       cityMap[r.origin]      ?? r.origin,
        destinationCity:  cityMap[r.destination] ?? r.destination,
        priceGbp:         live.priceGbp,
        airlineName:      live.airline,
        rating:           4.2,
        recommendation:   label,
        opportunityScore: 68,
        updatedAt:        now,
        bookingUrl:       aviasalesUrl(r.origin, r.destination, live.depDate),
        departureDate:    live.depDateStr || undefined,
      };
      return [entry];
    });

  return NextResponse.json({ entries, updatedAt: now });
}
