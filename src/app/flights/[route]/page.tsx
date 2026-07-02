import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTodayOffers, getRouteStats, getPriceHistory, getFareCalendar } from '@/lib/bfi/db';
import { getTpPriceCalendar, getTpCheapestMonths } from '@/lib/bfi/providers/travelpayouts';
import { recordView } from '@/lib/bfi/clicks';
import RouteDetail from './RouteDetail';

export const dynamic = 'force-dynamic';

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

  const { data: routeRow } = await db
    .from('bfi_routes')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .single();

  if (!routeRow) notFound();

  const thisMonth = new Date().toISOString().slice(0, 7);
  const nextMonth = new Date(Date.now() + 32 * 86_400_000).toISOString().slice(0, 7);

  const [
    offers, stats, { data: airports }, priceHistory, dbFareCalendar,
    tpCalendarThis, tpCalendarNext, cheapestMonths,
  ] = await Promise.all([
    getTodayOffers(routeRow.id),
    getRouteStats(routeRow.id),
    db.from('bfi_airports').select('code, name, city, country'),
    getPriceHistory(routeRow.id, 30),
    getFareCalendar(routeRow.id, 30),
    getTpPriceCalendar(origin, destination, thisMonth).catch(() => null),
    getTpPriceCalendar(origin, destination, nextMonth).catch(() => null),
    getTpCheapestMonths(origin, destination).catch(() => []),
  ]);

  // Merge TravelPayouts calendar data into day-by-price format
  const tpDays: { departure_date: string; price_gbp: number; airline_name: string }[] = [];
  for (const cal of [tpCalendarThis, tpCalendarNext]) {
    if (!cal) continue;
    for (const [date, price] of Object.entries(cal.calendar)) {
      tpDays.push({ departure_date: date, price_gbp: price, airline_name: 'TravelPayouts' });
    }
  }
  // Prefer TravelPayouts calendar (more data) over DB-only when available
  const fareCalendar = tpDays.length > 0 ? tpDays.sort((a, b) => a.departure_date.localeCompare(b.departure_date)) : dbFareCalendar;

  const airportMap: Record<string, { name: string; city: string; country: string }> = {};
  for (const a of airports ?? []) airportMap[a.code] = { name: a.name, city: a.city, country: a.country };

  recordView(routeRow.id, origin, destination).catch(() => {});

  const sorted   = [...offers].sort((a, b) => a.price_gbp - b.price_gbp);
  const cheapest = sorted[0] ?? null;

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
      origin={airportMap[origin]           ?? { name: origin,      city: origin,      country: '' }}
      destination={airportMap[destination] ?? { name: destination, city: destination, country: '' }}
      offers={sorted}
      cheapest={cheapest}
      stats={stats}
      todayViews={viewCount   ?? 0}
      todayClicks={clickCount ?? 0}
      priceHistory={priceHistory}
      fareCalendar={fareCalendar}
      cheapestMonths={cheapestMonths}
    />
  );
}
