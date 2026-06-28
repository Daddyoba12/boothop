import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTodayOffers, getRouteStats } from '@/lib/bfi/db';
import { recordView } from '@/lib/bfi/clicks';
import RouteDetail from './RouteDetail';

export const dynamic = 'force-dynamic';

// route param format: "lhr-los" → origin=LHR, destination=LOS
function parseRoute(slug: string): { origin: string; destination: string } | null {
  const parts = slug.toUpperCase().split('-');
  if (parts.length !== 2) return null;
  return { origin: parts[0], destination: parts[1] };
}

export default async function FlightRoutePage({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route: slug } = await params;
  const parsed = parseRoute(slug);
  if (!parsed) notFound();

  const { origin, destination } = parsed;

  const db = createSupabaseAdminClient();

  // Look up the route record
  const { data: routeRow } = await db
    .from('bfi_routes')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .single();

  if (!routeRow) notFound();

  const [offers, stats, { data: airports }] = await Promise.all([
    getTodayOffers(routeRow.id),
    getRouteStats(routeRow.id),
    db.from('bfi_airports').select('code, name, city, country'),
  ]);

  const airportMap: Record<string, { name: string; city: string; country: string }> = {};
  for (const a of airports ?? []) airportMap[a.code] = { name: a.name, city: a.city, country: a.country };

  // Log the page view (fire-and-forget)
  recordView(routeRow.id, origin, destination).catch(() => {});

  // Get today's cheapest and cheapest of next 14 days
  const sorted = [...offers].sort((a, b) => a.price_gbp - b.price_gbp);
  const cheapest = sorted[0] ?? null;

  // Count today's clicks and views for social proof
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [{ count: viewCount }, { count: clickCount }] = await Promise.all([
    db.from('bfi_route_views').select('id', { count: 'exact', head: true })
      .eq('route_id', routeRow.id).gte('viewed_at', today.toISOString()),
    db.from('bfi_clicks').select('id', { count: 'exact', head: true })
      .eq('route_id', routeRow.id).gte('clicked_at', today.toISOString()),
  ]);

  return (
    <RouteDetail
      route={routeRow}
      origin={airportMap[origin] ?? { name: origin, city: origin, country: '' }}
      destination={airportMap[destination] ?? { name: destination, city: destination, country: '' }}
      offers={sorted}
      cheapest={cheapest}
      stats={stats}
      todayViews={viewCount ?? 0}
      todayClicks={clickCount ?? 0}
    />
  );
}
