import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { bfiDb, getLatestSummaries, getAllRouteStats } from '@/lib/bfi/db';

// Public endpoint — returns featured routes for homepage ticker/cards
export async function GET() {
  const db = bfiDb();

  const [{ data: featured }, summaries, stats] = await Promise.all([
    db.from('bfi_featured_routes').select('*, route:bfi_routes(*)').eq('featured', true).order('position', { ascending: true }),
    getLatestSummaries(),
    getAllRouteStats(),
  ]);

  const { data: airports } = await db.from('bfi_airports').select('code, city, country');
  const airportMap: Record<string, { city: string; country: string }> = {};
  for (const a of airports ?? []) airportMap[a.code] = { city: a.city, country: a.country };

  const summaryMap: Record<string, typeof summaries[0]> = {};
  for (const s of summaries) summaryMap[s.route_id] = s;

  const statsMap: Record<string, typeof stats[0]> = {};
  for (const s of stats) statsMap[s.route_id] = s;

  const entries = (featured ?? []).map(f => {
    const route   = Array.isArray(f.route) ? f.route[0] : f.route;
    if (!route) return null;
    const summary = summaryMap[route.id];
    const stat    = statsMap[route.id];
    return {
      routeId:         route.id,
      origin:          route.origin,
      destination:     route.destination,
      originCity:      airportMap[route.origin]?.city      ?? route.origin,
      destCity:        airportMap[route.destination]?.city ?? route.destination,
      label:           f.label ?? null,
      position:        f.position,
      priceGbp:        summary?.cheapest_price_gbp  ?? null,
      airlineName:     summary?.cheapest_airline_name ?? null,
      savingGbp:       summary?.saving_vs_yesterday_gbp ?? null,
      opportunityScore: stat?.opportunity_score ?? 50,
      recommendation:  stat?.recommendation    ?? 'HOLD',
      trend:           stat?.trend             ?? 'stable',
    };
  }).filter(Boolean);

  return NextResponse.json({ entries });
}

// Admin — toggle featured / update position
export async function PATCH(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { routeId, featured, position, label } = await request.json() as {
    routeId: string;
    featured?: boolean;
    position?: number;
    label?: string;
  };

  if (!routeId) return NextResponse.json({ error: 'routeId required' }, { status: 400 });

  const db = bfiDb();
  await db.from('bfi_featured_routes').upsert({
    route_id:   routeId,
    featured:   featured ?? true,
    position:   position ?? 0,
    label:      label    ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'route_id' });

  return NextResponse.json({ ok: true });
}
