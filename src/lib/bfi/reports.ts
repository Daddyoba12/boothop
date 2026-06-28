import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface ReportRow {
  route:         string;
  cheapestGbp:   number | null;
  averageGbp:    number | null;
  biggestDrop:   number | null;
  totalOffers:   number;
  clicks:        number;
  views:         number;
  ctr:           number;
  topAirline:    string | null;
  trend:         string;
  recommendation: string;
}

export interface Report {
  period:       ReportPeriod;
  from:         string;
  to:           string;
  totalClicks:  number;
  totalViews:   number;
  totalOffers:  number;
  topRoute:     string | null;
  topAirline:   string | null;
  biggestDrop:  number | null;
  rows:         ReportRow[];
}

function startOfPeriod(period: ReportPeriod): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'weekly')  d.setDate(d.getDate() - 7);
  if (period === 'monthly') d.setDate(d.getDate() - 30);
  return d;
}

export async function generateReport(period: ReportPeriod): Promise<Report> {
  const db   = createSupabaseAdminClient();
  const from = startOfPeriod(period);
  const to   = new Date();
  const fromStr = from.toISOString();

  const [
    { data: routes },
    { data: summaries },
    { data: stats },
    { data: clicks },
    { data: views },
  ] = await Promise.all([
    db.from('bfi_routes').select('id, origin, destination').eq('enabled', true),
    db.from('bfi_daily_summaries').select('*').gte('date', from.toISOString().split('T')[0]),
    db.from('bfi_route_stats').select('*'),
    db.from('bfi_clicks').select('*').gte('clicked_at', fromStr),
    db.from('bfi_route_views').select('route_id').gte('viewed_at', fromStr),
  ]);

  const statsMap: Record<string, NonNullable<typeof stats>[0]> = {};
  for (const s of stats ?? []) statsMap[s.route_id] = s;

  const clicksByRoute: Record<string, number> = {};
  const airlineCounts: Record<string, number> = {};
  for (const c of clicks ?? []) {
    const key = `${c.origin} → ${c.destination}`;
    clicksByRoute[key] = (clicksByRoute[key] ?? 0) + 1;
    airlineCounts[c.airline_name] = (airlineCounts[c.airline_name] ?? 0) + 1;
  }

  const viewsByRoute: Record<string, number> = {};
  for (const v of views ?? []) {
    viewsByRoute[v.route_id] = (viewsByRoute[v.route_id] ?? 0) + 1;
  }

  const rows: ReportRow[] = (routes ?? []).map(r => {
    const routeLabel   = `${r.origin} → ${r.destination}`;
    const routeSums    = (summaries ?? []).filter(s => s.route_id === r.id);
    const prices       = routeSums.map(s => s.cheapest_price_gbp).filter(Boolean) as number[];
    const cheapestGbp  = prices.length ? Math.min(...prices) : null;
    const averageGbp   = prices.length ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : null;
    const drops        = routeSums.map(s => s.saving_vs_yesterday_gbp).filter((x): x is number => x != null && x > 0);
    const biggestDrop  = drops.length ? Math.max(...drops) : null;
    const clicks       = clicksByRoute[routeLabel] ?? 0;
    const routeViews   = viewsByRoute[r.id] ?? 0;
    const ctr          = routeViews > 0 ? Math.round((clicks / routeViews) * 100) : 0;
    const st           = statsMap[r.id];
    const airlineMap: Record<string, number> = {};
    for (const s of routeSums) {
      if (s.cheapest_airline_name) airlineMap[s.cheapest_airline_name] = (airlineMap[s.cheapest_airline_name] ?? 0) + 1;
    }
    const topAirline = Object.entries(airlineMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      route:          routeLabel,
      cheapestGbp,
      averageGbp,
      biggestDrop,
      totalOffers:    routeSums.reduce((s, r) => s + (r.offers_count ?? 0), 0),
      clicks,
      views:          routeViews,
      ctr,
      topAirline,
      trend:          st?.trend          ?? 'stable',
      recommendation: st?.recommendation ?? 'HOLD',
    };
  });

  const totalClicks = (clicks ?? []).length;
  const totalViews  = (views  ?? []).length;
  const topRouteEntry = Object.entries(clicksByRoute).sort((a, b) => b[1] - a[1])[0];
  const topAirlineEntry = Object.entries(airlineCounts).sort((a, b) => b[1] - a[1])[0];
  const allDrops = rows.map(r => r.biggestDrop).filter((x): x is number => x != null);

  return {
    period,
    from: from.toISOString(),
    to:   to.toISOString(),
    totalClicks,
    totalViews,
    totalOffers: rows.reduce((s, r) => s + r.totalOffers, 0),
    topRoute:    topRouteEntry?.[0]   ?? null,
    topAirline:  topAirlineEntry?.[0] ?? null,
    biggestDrop: allDrops.length ? Math.max(...allDrops) : null,
    rows,
  };
}

export function reportToCsv(report: Report): string {
  const header = [
    'Route', 'Cheapest (GBP)', 'Average (GBP)', 'Biggest Drop (GBP)',
    'Total Offers', 'Clicks', 'Views', 'CTR %', 'Top Airline', 'Trend', 'Signal',
  ].join(',');

  const dataRows = report.rows.map(r => [
    r.route,
    r.cheapestGbp   ?? '',
    r.averageGbp    ?? '',
    r.biggestDrop   ?? '',
    r.totalOffers,
    r.clicks,
    r.views,
    r.ctr,
    r.topAirline    ?? '',
    r.trend,
    r.recommendation,
  ].join(','));

  const meta = [
    `BootHop Flight Intelligence — ${report.period.charAt(0).toUpperCase() + report.period.slice(1)} Report`,
    `Period: ${new Date(report.from).toLocaleDateString('en-GB')} – ${new Date(report.to).toLocaleDateString('en-GB')}`,
    `Total Clicks: ${report.totalClicks} | Total Views: ${report.totalViews} | Top Route: ${report.topRoute ?? '—'} | Top Airline: ${report.topAirline ?? '—'}`,
    '',
  ];

  return [...meta, header, ...dataRows].join('\n');
}
