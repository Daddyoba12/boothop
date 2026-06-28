import {
  getEnabledRoutes,
  getTodayOffers,
  getYesterdaySummary,
  upsertDailySummary,
  upsertRouteStats,
  getRouteStats,
} from './db';
import {
  computeOpportunityScore,
  computeRecommendation,
  computeTrend,
} from './intelligence';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Runs after a scan to update daily summaries and route stats for all active routes.
export async function refreshStatistics(): Promise<void> {
  const routes = await getEnabledRoutes();

  await Promise.all(routes.map(async route => {
    const offers = await getTodayOffers(route.id);
    if (!offers.length) return;

    const prices  = offers.map(o => o.price_gbp);
    const cheapest = Math.min(...prices);
    const highest  = Math.max(...prices);
    const average  = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length * 100) / 100;

    const cheapestOffer = offers.find(o => o.price_gbp === cheapest)!;
    const yesterday     = await getYesterdaySummary(route.id);
    const savingVsYesterday = yesterday?.cheapest_price_gbp
      ? Math.round((yesterday.cheapest_price_gbp - cheapest) * 100) / 100
      : null;

    const today = new Date().toISOString().split('T')[0];
    await upsertDailySummary({
      route_id:               route.id,
      date:                   today,
      cheapest_price_gbp:     cheapest,
      average_price_gbp:      average,
      highest_price_gbp:      highest,
      cheapest_airline_code:  cheapestOffer.airline_code,
      cheapest_airline_name:  cheapestOffer.airline_name,
      offers_count:           offers.length,
      saving_vs_yesterday_gbp: savingVsYesterday,
    });

    // Pull 90 days of daily summaries to compute rolling averages + trend
    const db = createSupabaseAdminClient();
    const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString().split('T')[0];
    const { data: history } = await db
      .from('bfi_daily_summaries')
      .select('date, cheapest_price_gbp')
      .eq('route_id', route.id)
      .gte('date', since90)
      .order('date', { ascending: true });

    const histPrices = (history ?? [])
      .filter(h => h.cheapest_price_gbp != null)
      .map(h => h.cheapest_price_gbp as number);

    const last30 = histPrices.slice(-30);
    const avg30  = last30.length
      ? Math.round(last30.reduce((s, p) => s + p, 0) / last30.length * 100) / 100
      : null;
    const avg90  = histPrices.length
      ? Math.round(histPrices.reduce((s, p) => s + p, 0) / histPrices.length * 100) / 100
      : null;

    const { trend, trendPct } = computeTrend(histPrices);

    const existing = await getRouteStats(route.id);
    const allTimeLow = existing?.all_time_lowest_gbp != null
      ? Math.min(existing.all_time_lowest_gbp, cheapest)
      : cheapest;
    const allTimeHigh = existing?.all_time_highest_gbp != null
      ? Math.max(existing.all_time_highest_gbp, highest)
      : highest;

    const score = computeOpportunityScore(cheapest, { thirty_day_avg_gbp: avg30, ninety_day_avg_gbp: avg90, all_time_lowest_gbp: allTimeLow, trend });
    const recommendation = computeRecommendation(score);

    await upsertRouteStats({
      route_id:                route.id,
      all_time_lowest_gbp:     allTimeLow,
      all_time_highest_gbp:    allTimeHigh,
      thirty_day_avg_gbp:      avg30,
      ninety_day_avg_gbp:      avg90,
      trend,
      trend_pct:               trendPct,
      cheapest_airline_code:   cheapestOffer.airline_code,
      cheapest_airline_name:   cheapestOffer.airline_name,
      opportunity_score:       score,
      recommendation,
      best_booking_window_days: null,
      best_month:               null,
      last_updated:             new Date().toISOString(),
    });
  }));
}
