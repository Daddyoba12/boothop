import {
  getEnabledRoutes,
  createSearchRun,
  completeSearchRun,
  failSearchRun,
  insertFlightOffers,
  getYesterdaySummary,
  createAlert,
} from './db';
import { refreshStatistics } from './statistics';
import { mergeSearch, providerSummary, getActiveProviders } from './providers/merger';
import { sendPriceDropAlert } from './email-alerts';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function updateProviderStatus(
  name: string, success: boolean, latencyMs: number, error?: string,
) {
  try {
    const db  = createSupabaseAdminClient();
    const now = new Date().toISOString();
    await db.from('bfi_provider_status').upsert({
      provider:        name,
      status:          success ? 'online' : 'degraded',
      last_checked_at: now,
      last_success_at: success ? now : undefined,
      last_error:      error   ?? null,
      avg_latency_ms:  latencyMs,
    }, { onConflict: 'provider' });
  } catch { /* non-critical */ }
}

// 14 departure dates starting tomorrow so we capture a spread of prices per route
function getDepartureDates(count = 14): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

export async function runScan(): Promise<{
  searchRunId:    string;
  routesSearched: number;
  offersFound:    number;
  durationMs:     number;
  providers:      string;
}> {
  // Verify at least one provider is reachable before committing to a run
  const providers   = getActiveProviders();
  const availChecks = await Promise.allSettled(providers.map(p => p.isAvailable()));
  const online      = providers.filter((_, i) => availChecks[i].status === 'fulfilled' && (availChecks[i] as PromiseFulfilledResult<boolean>).value);

  if (!online.length) throw new Error('No providers available');

  const routes     = await getEnabledRoutes();
  const provLabel  = online.map(p => p.name).join('+');
  const runId      = await createSearchRun(provLabel);
  const startedAt  = Date.now();
  let   totalOffers = 0;

  try {
    const departureDates = getDepartureDates(14);

    await Promise.all(routes.map(async route => {
      const allOffers: Parameters<typeof insertFlightOffers>[0] = [];

      for (const date of departureDates) {
        const t0     = Date.now();
        const result = await mergeSearch({
          origin:        route.origin,
          destination:   route.destination,
          departureDate: date,
        });

        const latency = Date.now() - t0;

        // Update provider status for each provider that responded
        for (const [pName, pResult] of Object.entries(result.providerResults)) {
          await updateProviderStatus(pName, !pResult.error, latency, pResult.error);
        }

        for (const o of result.offers) {
          allOffers.push({
            search_run_id:    runId,
            route_id:         route.id,
            origin:           o.origin,
            destination:      o.destination,
            airline_code:     o.airlineCode,
            airline_name:     o.airlineName,
            flight_number:    o.flightNumber   ?? null,
            departure_at:     o.departureAt.toISOString(),
            arrival_at:       o.arrivalAt.toISOString(),
            travel_time_mins: o.travelTimeMins,
            stops:            o.stops,
            price_gbp:        o.priceGbp,
            currency:         'GBP',
            cabin:            o.cabin,
            baggage_included: o.baggageIncluded,
            cabin_bag_incl:   o.cabinBagIncluded,
            fare_class:       o.fareClass       ?? null,
            refundable:       o.refundable,
            change_fee_gbp:   o.changeFeeGbp    ?? null,
            available_seats:  o.availableSeats  ?? null,
            booking_url:      o.bookingUrl      ?? null,
            provider:         providerSummary(result),
          });
        }
      }

      if (allOffers.length) {
        await insertFlightOffers(allOffers);
        totalOffers += allOffers.length;

        const prices        = allOffers.map(o => o.price_gbp);
        const cheapest      = Math.min(...prices);
        const cheapestOffer = allOffers.find(o => o.price_gbp === cheapest)!;
        const yesterday     = await getYesterdaySummary(route.id);

        if (yesterday?.cheapest_price_gbp && cheapest < yesterday.cheapest_price_gbp) {
          const saving = Math.round((yesterday.cheapest_price_gbp - cheapest) * 100) / 100;
          await createAlert({
            route_id:           route.id,
            type:               'price_drop',
            title:              `Price drop: ${route.origin} → ${route.destination}`,
            message:            `${cheapestOffer.airline_name} now from £${cheapest.toFixed(0)} — down £${saving.toFixed(0)} vs yesterday`,
            price_gbp:          cheapest,
            previous_price_gbp: yesterday.cheapest_price_gbp,
            airline_code:       cheapestOffer.airline_code,
            airline_name:       cheapestOffer.airline_name,
            severity:           saving > 40 ? 'success' : 'info',
          });
          // Email alert — fire and forget so a slow email doesn't block the scan
          sendPriceDropAlert({
            origin:       route.origin,
            destination:  route.destination,
            originCity:   route.origin,
            destCity:     route.destination,
            priceGbp:     cheapest,
            prevPriceGbp: yesterday.cheapest_price_gbp,
            airlineName:  cheapestOffer.airline_name,
            routeSlug:    `${route.origin.toLowerCase()}-${route.destination.toLowerCase()}`,
          }).catch(() => {});
        }
      }
    }));

    await refreshStatistics();

    const durationMs = Date.now() - startedAt;
    await completeSearchRun(runId, routes.length, totalOffers, durationMs);

    return { searchRunId: runId, routesSearched: routes.length, offersFound: totalOffers, durationMs, providers: provLabel };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failSearchRun(runId, message);
    throw err;
  }
}
