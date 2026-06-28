import { NextResponse } from 'next/server';
import type { TickerEntry } from '@/lib/bfi/types';

export const revalidate = 3600;

const MARKER = process.env.TRAVELPAYOUTS_MARKER ?? '544322';

// These routes are always shown — TravelPayouts live price is tried first,
// then the hardcoded estimate is used so the ticker is never empty.
const FEATURED_ROUTES = [
  { origin: 'LHR', destination: 'LOS', originCity: 'London',      destinationCity: 'Lagos',        fallbackPrice: 320, fallbackAirline: 'Air Peace' },
  { origin: 'LHR', destination: 'ACC', originCity: 'London',      destinationCity: 'Accra',        fallbackPrice: 380, fallbackAirline: 'British Airways' },
  { origin: 'LHR', destination: 'ABV', originCity: 'London',      destinationCity: 'Abuja',        fallbackPrice: 355, fallbackAirline: 'Turkish Airlines' },
  { origin: 'LHR', destination: 'KGL', originCity: 'London',      destinationCity: 'Kigali',       fallbackPrice: 445, fallbackAirline: 'RwandAir' },
  { origin: 'LHR', destination: 'NBO', originCity: 'London',      destinationCity: 'Nairobi',      fallbackPrice: 420, fallbackAirline: 'Kenya Airways' },
  { origin: 'LHR', destination: 'CMN', originCity: 'London',      destinationCity: 'Casablanca',   fallbackPrice: 175, fallbackAirline: 'Royal Air Maroc' },
  { origin: 'LGW', destination: 'DXB', originCity: 'London',      destinationCity: 'Dubai',        fallbackPrice: 265, fallbackAirline: 'Emirates' },
  { origin: 'LHR', destination: 'JNB', originCity: 'London',      destinationCity: 'Johannesburg', fallbackPrice: 475, fallbackAirline: 'British Airways' },
  { origin: 'MAN', destination: 'LOS', originCity: 'Manchester',  destinationCity: 'Lagos',        fallbackPrice: 340, fallbackAirline: 'Air Peace' },
  { origin: 'LHR', destination: 'CAI', originCity: 'London',      destinationCity: 'Cairo',        fallbackPrice: 210, fallbackAirline: 'EgyptAir' },
];

const AIRLINE_NAMES: Record<string, string> = {
  AP: 'Air Peace', WB: 'RwandAir', AT: 'Royal Air Maroc', TK: 'Turkish Airlines',
  ET: 'Ethiopian Airlines', BA: 'British Airways', VS: 'Virgin Atlantic',
  KQ: 'Kenya Airways', MS: 'EgyptAir', LH: 'Lufthansa', AF: 'Air France',
  KL: 'KLM', QR: 'Qatar Airways', EK: 'Emirates', EY: 'Etihad Airways',
  FR: 'Ryanair', U2: 'easyJet', W6: 'Wizz Air',
};

function aviasalesUrl(origin: string, destination: string, daysAhead = 14): string {
  const d    = new Date(Date.now() + daysAhead * 86_400_000);
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  return `https://www.aviasales.com/search/${origin.toUpperCase()}${day}${mon}${destination.toUpperCase()}1?marker=${MARKER}`;
}

async function fetchTpPrice(origin: string, destination: string): Promise<{ price: number; airline: string } | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return null;

  try {
    const month = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 7);
    const url   = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    url.searchParams.set('origin',      origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('depart_date', month);
    url.searchParams.set('currency',    'gbp');
    url.searchParams.set('token',       token);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data?.[destination] ?? {};

    let cheapestPrice   = Infinity;
    let cheapestAirline = '';

    for (const [code, flight] of Object.entries(data) as [string, any][]) {
      const price = Math.round(flight.price ?? 0);
      if (price > 0 && price < cheapestPrice) {
        cheapestPrice   = price;
        cheapestAirline = AIRLINE_NAMES[code] ?? code;
      }
    }

    return cheapestPrice < Infinity ? { price: cheapestPrice, airline: cheapestAirline } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  // Fetch live TP prices for all featured routes in parallel
  const results = await Promise.allSettled(
    FEATURED_ROUTES.map(r => fetchTpPrice(r.origin, r.destination))
  );

  const now = new Date().toISOString();

  const entries: TickerEntry[] = FEATURED_ROUTES.map((r, i) => {
    const live        = results[i].status === 'fulfilled' ? results[i].value : null;
    const priceGbp    = live?.price    ?? r.fallbackPrice;
    const airlineName = live?.airline  ?? r.fallbackAirline;
    const isLive      = live !== null && live.price > 0;

    return {
      origin:          r.origin,
      destination:     r.destination,
      originCity:      r.originCity,
      destinationCity: r.destinationCity,
      priceGbp,
      airlineName,
      rating:          4.2,
      recommendation:  isLive ? 'Live Price' : 'From ~£' + priceGbp,
      opportunityScore: isLive ? 65 : 50,
      updatedAt:       now,
      bookingUrl:      aviasalesUrl(r.origin, r.destination),
    };
  });

  return NextResponse.json({ entries, updatedAt: now });
}
