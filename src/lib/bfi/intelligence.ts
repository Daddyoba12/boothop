import type { BFIRouteStats } from './types';

// Calculates an opportunity score 0–100 for a given route based on current
// price vs historical averages. Higher = better time to book.
export function computeOpportunityScore(
  currentCheapest: number | null,
  stats: Partial<BFIRouteStats>,
): number {
  if (!currentCheapest) return 50;

  let score = 50;

  const avg30  = stats.thirty_day_avg_gbp  ?? null;
  const avg90  = stats.ninety_day_avg_gbp  ?? null;
  const lowest = stats.all_time_lowest_gbp ?? null;
  const trend  = stats.trend               ?? 'stable';

  // vs 30-day average
  if (avg30) {
    const pct = (avg30 - currentCheapest) / avg30 * 100;
    if (pct > 15)      score += 20;
    else if (pct > 8)  score += 12;
    else if (pct > 3)  score += 6;
    else if (pct < -5) score -= 8;
    else if (pct < -10) score -= 15;
  }

  // vs 90-day average
  if (avg90) {
    const pct = (avg90 - currentCheapest) / avg90 * 100;
    if (pct > 15)     score += 15;
    else if (pct > 8) score += 8;
    else if (pct < 0) score -= 5;
  }

  // proximity to all-time low
  if (lowest) {
    const pct = (currentCheapest - lowest) / lowest * 100;
    if (pct <= 2)      score += 25;
    else if (pct <= 8) score += 12;
    else if (pct > 30) score -= 10;
  }

  // trend modifier
  if (trend === 'falling') score += 8;
  if (trend === 'rising')  score -= 8;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function computeRecommendation(score: number): 'BUY' | 'HOLD' | 'WAIT' {
  if (score >= 72) return 'BUY';
  if (score >= 42) return 'HOLD';
  return 'WAIT';
}

// Derives a human-readable trend from a series of daily cheapest prices.
// Expects prices ordered oldest → newest.
export function computeTrend(prices: number[]): {
  trend: 'rising' | 'falling' | 'stable';
  trendPct: number;
} {
  if (prices.length < 3) return { trend: 'stable', trendPct: 0 };

  const half   = Math.floor(prices.length / 2);
  const first  = prices.slice(0, half);
  const second = prices.slice(-half);

  const avgFirst  = first.reduce((s, p) => s + p, 0) / first.length;
  const avgSecond = second.reduce((s, p) => s + p, 0) / second.length;

  const pct = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (pct >  3) return { trend: 'rising',  trendPct: Math.round(pct * 10) / 10 };
  if (pct < -3) return { trend: 'falling', trendPct: Math.round(pct * 10) / 10 };
  return           { trend: 'stable',  trendPct: 0 };
}

// Builds the AI brief shown on Mission Control.
export function buildAiBrief(
  routes: Array<{
    label: string;
    currentGbp: number | null;
    avg30Gbp: number | null;
    trend: string;
    recommendation: string;
  }>,
): string {
  const lines: string[] = [];

  for (const r of routes) {
    if (!r.currentGbp || !r.avg30Gbp) continue;
    const diff = r.avg30Gbp - r.currentGbp;
    const pct  = Math.round(Math.abs(diff) / r.avg30Gbp * 100);
    if (diff > 20) {
      lines.push(`${r.label} fares are ${pct}% below the 30-day average — good time to book.`);
    } else if (diff < -20) {
      lines.push(`${r.label} fares are running ${pct}% above average.`);
    }
    if (r.trend === 'falling') {
      lines.push(`${r.label} prices are on a downward trend.`);
    }
  }

  if (!lines.length) return 'Fares are tracking close to their 30-day averages across all monitored routes.';
  return lines.join(' ');
}
