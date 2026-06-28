import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import {
  getLatestSummaries,
  getAllRouteStats,
  getRecentSearchRuns,
  getUnreadAlertsCount,
  getTotalOffersCount,
  getAllRoutes,
  bfiDb,
} from '@/lib/bfi/db';
import { buildAiBrief } from '@/lib/bfi/intelligence';
import type { MissionControlData } from '@/lib/bfi/types';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [summaries, allStats, runs, unreadAlerts, totalOffers, routes] = await Promise.all([
    getLatestSummaries(),
    getAllRouteStats(),
    getRecentSearchRuns(10),
    getUnreadAlertsCount(),
    getTotalOffersCount(),
    getAllRoutes(),
  ]);

  // Fetch airports for city labels
  const db = bfiDb();
  const { data: airports } = await db.from('bfi_airports').select('code, city');
  const airportMap: Record<string, string> = {};
  for (const a of airports ?? []) airportMap[a.code] = a.city;

  const statsMap: Record<string, typeof allStats[0]> = {};
  for (const s of allStats) statsMap[s.route_id] = s;

  const routeMap: Record<string, typeof routes[0]> = {};
  for (const r of routes) routeMap[r.id] = r;

  // Identify routes needing attention (no stats or score < 40 or missing data)
  const routesAttention = routes.filter(r => {
    const s = statsMap[r.id];
    return !s || s.opportunity_score < 30;
  }).length;
  const routesHealthy = routes.filter(r => r.enabled).length - routesAttention;

  // Biggest saving today
  let biggestSaving: { saving: number; route: string } | null = null;
  for (const s of summaries) {
    if (s.saving_vs_yesterday_gbp && s.saving_vs_yesterday_gbp > 0) {
      if (!biggestSaving || s.saving_vs_yesterday_gbp > biggestSaving.saving) {
        const r = routeMap[s.route_id];
        if (r) {
          biggestSaving = {
            saving: s.saving_vs_yesterday_gbp,
            route: `${r.origin} → ${r.destination}`,
          };
        }
      }
    }
  }

  // Best opportunity
  const bestStat = [...allStats].sort((a, b) => b.opportunity_score - a.opportunity_score)[0];
  const bestRoute = bestStat ? routeMap[bestStat.route_id] : null;

  // Cheapest one-way today
  const sorted = summaries
    .filter(s => s.cheapest_price_gbp != null)
    .sort((a, b) => a.cheapest_price_gbp! - b.cheapest_price_gbp!);

  const cheapestOneway = sorted[0]
    ? {
        route:   `${routeMap[sorted[0].route_id]?.origin} → ${routeMap[sorted[0].route_id]?.destination}`,
        price:   sorted[0].cheapest_price_gbp!,
        airline: sorted[0].cheapest_airline_name ?? '',
      }
    : null;

  // Last scan
  const lastRun = runs[0];
  const avgScanMs = runs
    .filter(r => r.duration_ms)
    .reduce((s, r, _, arr) => s + (r.duration_ms ?? 0) / arr.length, 0) || null;

  // AI brief
  const briefInputs = routes.map(r => {
    const stats   = statsMap[r.id];
    const summary = summaries.find(s => s.route_id === r.id);
    return {
      label:       `${airportMap[r.origin] ?? r.origin} → ${airportMap[r.destination] ?? r.destination}`,
      currentGbp:  summary?.cheapest_price_gbp ?? null,
      avg30Gbp:    stats?.thirty_day_avg_gbp   ?? null,
      trend:       stats?.trend                ?? 'stable',
      recommendation: stats?.recommendation   ?? 'HOLD',
    };
  });
  const aiSummary = buildAiBrief(briefInputs);

  const data: MissionControlData = {
    routesHealthy,
    routesAttention,
    biggestSavingGbp:     biggestSaving?.saving     ?? null,
    biggestSavingRoute:   biggestSaving?.route       ?? null,
    bestOpportunityRoute: bestRoute ? `${bestRoute.origin} → ${bestRoute.destination}` : null,
    bestOpportunityScore: bestStat?.opportunity_score ?? null,
    flightsMonitored:     totalOffers,
    cheapestOneway,
    cheapestReturn:       null,  // Sprint 2: return intelligence
    lastScanAt:           lastRun?.completed_at ?? null,
    avgScanMs:            avgScanMs ? Math.round(avgScanMs) : null,
    providersOnline:      1,     // Sprint 2: real provider health checks
    providersOffline:     0,
    unreadAlerts,
    aiSummary,
  };

  return NextResponse.json(data);
}
