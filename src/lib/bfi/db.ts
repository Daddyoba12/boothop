import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  BFIRoute, BFIDailySummary, BFIRouteStats, BFISearchRun, BFIFlightOffer, BFIAlert,
} from './types';

export function bfiDb() {
  return createSupabaseAdminClient();
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function getEnabledRoutes(): Promise<BFIRoute[]> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_routes')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllRoutes(): Promise<BFIRoute[]> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_routes')
    .select('*')
    .order('priority', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function toggleRoute(id: string, enabled: boolean): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_routes').update({ enabled }).eq('id', id);
  if (error) throw error;
}

// ── Search Runs ───────────────────────────────────────────────────────────────

export async function createSearchRun(provider: string): Promise<string> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_search_runs')
    .insert({ provider, status: 'running' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function completeSearchRun(
  id: string,
  routesSearched: number,
  offersFound: number,
  durationMs: number,
): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_search_runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    routes_searched: routesSearched,
    offers_found: offersFound,
    duration_ms: durationMs,
  }).eq('id', id);
  if (error) throw error;
}

export async function failSearchRun(id: string, errorMsg: string): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_search_runs').update({
    status: 'failed',
    completed_at: new Date().toISOString(),
    error: errorMsg,
  }).eq('id', id);
  if (error) throw error;
}

export async function getRecentSearchRuns(limit = 20): Promise<BFISearchRun[]> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_search_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ── Flight Offers ─────────────────────────────────────────────────────────────

export async function insertFlightOffers(offers: Omit<BFIFlightOffer, 'id' | 'scanned_at'>[]): Promise<void> {
  if (!offers.length) return;
  const db = bfiDb();
  const { error } = await db.from('bfi_flight_offers').insert(offers);
  if (error) throw error;
}

export async function getTodayOffers(routeId: string): Promise<BFIFlightOffer[]> {
  const db = bfiDb();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db
    .from('bfi_flight_offers')
    .select('*')
    .eq('route_id', routeId)
    .gte('scanned_at', `${today}T00:00:00Z`)
    .order('price_gbp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTotalOffersCount(): Promise<number> {
  const db = bfiDb();
  const { count, error } = await db
    .from('bfi_flight_offers')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

// ── Daily Summaries ───────────────────────────────────────────────────────────

export async function upsertDailySummary(summary: Omit<BFIDailySummary, 'id' | 'created_at'>): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_daily_summaries').upsert(summary, {
    onConflict: 'route_id,date',
  });
  if (error) throw error;
}

export async function getLatestSummaries(): Promise<BFIDailySummary[]> {
  const db = bfiDb();
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db
    .from('bfi_daily_summaries')
    .select('*')
    .eq('date', today)
    .order('cheapest_price_gbp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getYesterdaySummary(routeId: string): Promise<BFIDailySummary | null> {
  const db = bfiDb();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  const { data, error } = await db
    .from('bfi_daily_summaries')
    .select('*')
    .eq('route_id', routeId)
    .eq('date', yesterday)
    .single();
  if (error) return null;
  return data ?? null;
}

// ── Route Stats ───────────────────────────────────────────────────────────────

export async function upsertRouteStats(stats: BFIRouteStats): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_route_stats').upsert({
    ...stats,
    last_updated: new Date().toISOString(),
  }, { onConflict: 'route_id' });
  if (error) throw error;
}

export async function getAllRouteStats(): Promise<BFIRouteStats[]> {
  const db = bfiDb();
  const { data, error } = await db.from('bfi_route_stats').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function getRouteStats(routeId: string): Promise<BFIRouteStats | null> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_route_stats')
    .select('*')
    .eq('route_id', routeId)
    .single();
  if (error) return null;
  return data ?? null;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function createAlert(alert: Omit<BFIAlert, 'id' | 'created_at' | 'read'>): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_alerts').insert(alert);
  if (error) throw error;
}

export async function getAlerts(limit = 50): Promise<BFIAlert[]> {
  const db = bfiDb();
  const { data, error } = await db
    .from('bfi_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markAlertRead(id: string): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_alerts').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllAlertsRead(): Promise<void> {
  const db = bfiDb();
  const { error } = await db.from('bfi_alerts').update({ read: true }).eq('read', false);
  if (error) throw error;
}

export async function getUnreadAlertsCount(): Promise<number> {
  const db = bfiDb();
  const { count, error } = await db
    .from('bfi_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}
