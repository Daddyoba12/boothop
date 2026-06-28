import { NextResponse } from 'next/server';
import { bfiDb, getLatestSummaries, getAllRouteStats, getAllRoutes } from '@/lib/bfi/db';
import type { TickerEntry } from '@/lib/bfi/types';

export const revalidate = 3600;

// Fetch cheapest fare per route directly from TravelPayouts Data API
async function fetchTpCheapest(
  origin: string,
  destination: string,
): Promise<{ priceGbp: number; airlineName: string } | null> {
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

    const AIRLINE_NAMES: Record<string, string> = {
      AP: 'Air Peace', WB: 'RwandAir', AT: 'Royal Air Maroc', TK: 'Turkish Airlines',
      ET: 'Ethiopian Airlines', BA: 'British Airways', VS: 'Virgin Atlantic',
      KQ: 'Kenya Airways', MS: 'EgyptAir', LH: 'Lufthansa', AF: 'Air France',
      KL: 'KLM', QR: 'Qatar Airways', EK: 'Emirates', EY: 'Etihad Airways',
    };

    for (const [code, flight] of Object.entries(data) as [string, any][]) {
      const price = Math.round(flight.price ?? 0);
      if (price > 0 && price < cheapestPrice) {
        cheapestPrice   = price;
        cheapestAirline = AIRLINE_NAMES[code] ?? code;
      }
    }

    if (cheapestPrice === Infinity) return null;

    return { priceGbp: cheapestPrice, airlineName: cheapestAirline };
  } catch {
    return null;
  }
}

export async function GET() {
  const [summaries, stats, routes] = await Promise.all([
    getLatestSummaries(),
    getAllRouteStats(),
    getAllRoutes(),
  ]);

  const db = bfiDb();
  const { data: airports } = await db.from('bfi_airports').select('code, city');
  const airportMap: Record<string, string> = {};
  for (const a of airports ?? []) airportMap[a.code] = a.city;

  const statsMap: Record<string, typeof stats[0]>         = {};
  const summaryMap: Record<string, typeof summaries[0]>   = {};
  for (const s of stats)     statsMap[s.route_id]    = s;
  for (const s of summaries) summaryMap[s.route_id]  = s;

  const enabledRoutes = routes.filter(r => r.enabled);

  // ── Build entries from DB scan data ──────────────────────────────────────
  let entries: TickerEntry[] = enabledRoutes
    .map(r => {
      const s  = summaryMap[r.id];
      const st = statsMap[r.id];
      if (!s?.cheapest_price_gbp) return null;

      const score = st?.opportunity_score ?? 50;
      return {
        origin:          r.origin,
        destination:     r.destination,
        originCity:      airportMap[r.origin]      ?? r.origin,
        destinationCity: airportMap[r.destination] ?? r.destination,
        priceGbp:        s.cheapest_price_gbp,
        airlineName:     s.cheapest_airline_name ?? '',
        rating:          4.0,
        recommendation:  score >= 72 ? 'Excellent Deal' : score >= 55 ? 'Good Price' : score < 35 ? 'Prices High' : 'Fair Price',
        opportunityScore: score,
        updatedAt:       s.created_at,
      } satisfies TickerEntry;
    })
    .filter((e): e is TickerEntry => e !== null)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  // ── Fallback: use TravelPayouts live data when DB has no scan data ────────
  if (entries.length < 2 && process.env.TRAVELPAYOUTS_TOKEN) {
    const tpResults = await Promise.allSettled(
      enabledRoutes.map(async r => {
        const tp = await fetchTpCheapest(r.origin, r.destination);
        if (!tp) return null;
        const st    = statsMap[r.id];
        const score = st?.opportunity_score ?? 55;
        return {
          origin:          r.origin,
          destination:     r.destination,
          originCity:      airportMap[r.origin]      ?? r.origin,
          destinationCity: airportMap[r.destination] ?? r.destination,
          priceGbp:        tp.priceGbp,
          airlineName:     tp.airlineName,
          rating:          4.0,
          recommendation:  'Live Price',
          opportunityScore: score,
          updatedAt:       new Date().toISOString(),
        } satisfies TickerEntry;
      })
    );

    const tpEntries = tpResults
      .filter((r): r is PromiseFulfilledResult<TickerEntry | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((e): e is TickerEntry => e !== null && e.priceGbp > 0);

    if (tpEntries.length > 0) entries = tpEntries;
  }

  return NextResponse.json({ entries, updatedAt: new Date().toISOString() });
}
