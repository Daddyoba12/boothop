import { NextResponse } from 'next/server';
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

// Routes to feature in the ticker — London↔Lagos are first and most prominent
const ROUTES = [
  { origin: 'LHR', destination: 'LOS', originCity: 'London',     destinationCity: 'Lagos',        fallbackPrice: 318, fallbackAirline: 'Air Peace' },
  { origin: 'LOS', destination: 'LHR', originCity: 'Lagos',      destinationCity: 'London',       fallbackPrice: 295, fallbackAirline: 'Air Peace' },
  { origin: 'LHR', destination: 'ACC', originCity: 'London',     destinationCity: 'Accra',        fallbackPrice: 374, fallbackAirline: 'British Airways' },
  { origin: 'LHR', destination: 'ABV', originCity: 'London',     destinationCity: 'Abuja',        fallbackPrice: 348, fallbackAirline: 'Turkish Airlines' },
  { origin: 'LHR', destination: 'KGL', originCity: 'London',     destinationCity: 'Kigali',       fallbackPrice: 442, fallbackAirline: 'RwandAir' },
  { origin: 'LHR', destination: 'NBO', originCity: 'London',     destinationCity: 'Nairobi',      fallbackPrice: 418, fallbackAirline: 'Kenya Airways' },
  { origin: 'LGW', destination: 'DXB', originCity: 'London',     destinationCity: 'Dubai',        fallbackPrice: 262, fallbackAirline: 'Emirates' },
  { origin: 'MAN', destination: 'LOS', originCity: 'Manchester', destinationCity: 'Lagos',        fallbackPrice: 336, fallbackAirline: 'Air Peace' },
];

export async function GET() {
  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    ROUTES.map(r => cheapestThisWeek(r.origin, r.destination, 7))
  );

  const entries: TickerEntry[] = ROUTES.map((r, i) => {
    const live = results[i].status === 'fulfilled' ? results[i].value : null;

    const priceGbp    = live?.priceGbp   ?? r.fallbackPrice;
    const airlineN    = live?.airline    ?? r.fallbackAirline;
    const depDateStr  = live?.depDateStr ?? '';
    const depDate     = live?.depDate    ?? new Date(Date.now() + 3 * 86_400_000);
    const isLive      = !!live;

    const label = depDateStr ? formatDate(depDateStr) : 'This week';

    return {
      origin:          r.origin,
      destination:     r.destination,
      originCity:      r.originCity,
      destinationCity: r.destinationCity,
      priceGbp,
      airlineName:     airlineN,
      rating:          4.2,
      recommendation:  label,
      opportunityScore: isLive ? 68 : 50,
      updatedAt:       now,
      bookingUrl:      aviasalesUrl(r.origin, r.destination, depDate),
      departureDate:   depDateStr || undefined,
    };
  });

  return NextResponse.json({ entries, updatedAt: now });
}
