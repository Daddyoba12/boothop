import { NextResponse } from 'next/server';
import { bfiDb, getLatestSummaries, getAllRouteStats, getAllRoutes } from '@/lib/bfi/db';
import type { TickerEntry } from '@/lib/bfi/types';

export const revalidate = 3600; // refresh ticker data once per hour

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

  const statsMap: Record<string, typeof stats[0]> = {};
  for (const s of stats) statsMap[s.route_id] = s;

  const summaryMap: Record<string, typeof summaries[0]> = {};
  for (const s of summaries) summaryMap[s.route_id] = s;

  const entries: TickerEntry[] = routes
    .filter(r => r.enabled)
    .map(r => {
      const s   = summaryMap[r.id];
      const st  = statsMap[r.id];
      if (!s?.cheapest_price_gbp) return null;

      const score = st?.opportunity_score ?? 50;
      let recommendation = 'Fair Price';
      if (score >= 72) recommendation = 'Excellent Time To Book';
      else if (score >= 55) recommendation = 'Good Time To Book';
      else if (score < 35) recommendation = 'Prices Are High';

      return {
        origin:           r.origin,
        destination:      r.destination,
        originCity:       airportMap[r.origin]      ?? r.origin,
        destinationCity:  airportMap[r.destination] ?? r.destination,
        priceGbp:         s.cheapest_price_gbp,
        airlineName:      s.cheapest_airline_name   ?? '',
        rating:           4.0,
        recommendation,
        opportunityScore: score,
        updatedAt:        s.created_at,
      } satisfies TickerEntry;
    })
    .filter((e): e is TickerEntry => e !== null)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  return NextResponse.json({ entries, updatedAt: new Date().toISOString() });
}
