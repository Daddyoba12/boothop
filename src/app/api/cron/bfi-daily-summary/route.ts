import { NextResponse } from 'next/server';
import { getLatestSummaries, getAllRouteStats, getAllRoutes } from '@/lib/bfi/db';
import { getTodayClickCount } from '@/lib/bfi/clicks';
import { sendDailySummaryEmail } from '@/lib/bfi/email-alerts';

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
    ?? new URL(request.url).searchParams.get('cronSecret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [summaries, stats, routes, totalClicks] = await Promise.all([
    getLatestSummaries(),
    getAllRouteStats(),
    getAllRoutes(),
    getTodayClickCount(),
  ]);

  const statsMap: Record<string, typeof stats[0]> = {};
  for (const s of stats) statsMap[s.route_id] = s;

  const summaryMap: Record<string, typeof summaries[0]> = {};
  for (const s of summaries) summaryMap[s.route_id] = s;

  const rows = routes.map(r => {
    const s  = summaryMap[r.id];
    const st = statsMap[r.id];
    return {
      route:    `${r.origin} → ${r.destination}`,
      priceGbp: s?.cheapest_price_gbp       ?? null,
      airline:  s?.cheapest_airline_name    ?? null,
      saving:   s?.saving_vs_yesterday_gbp  ?? null,
      score:    st?.opportunity_score       ?? 50,
      signal:   st?.recommendation          ?? 'HOLD',
    };
  });

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  await sendDailySummaryEmail({ date: today, routes: rows, totalClicks });

  return NextResponse.json({ ok: true, routeCount: rows.length, totalClicks });
}
