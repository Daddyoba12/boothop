import type { BFIProvider } from './interface';
import type { RawFlightOffer, SearchParams } from '../types';
import { KiwiProvider }                from './kiwi';
import { AmadeusProvider }             from './amadeus';
import { MockProvider }                from './mock';
import { TravelPayoutsDataProvider }   from './travelpayouts';

// Returns which providers are active based on environment variables
export function getActiveProviders(): BFIProvider[] {
  const providers: BFIProvider[] = [];

  if (process.env.KIWI_API_KEY) {
    providers.push(new KiwiProvider());
  }

  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    providers.push(new AmadeusProvider());
  }

  if (process.env.TRAVELPAYOUTS_TOKEN) {
    providers.push(new TravelPayoutsDataProvider());
  }

  // Fall back to mock only when no real providers are configured
  if (!providers.length) {
    providers.push(new MockProvider());
  }

  return providers;
}

// Deduplication key: same carrier + flight number + departure hour = same flight
// We keep the cheapest version when the same flight appears across providers.
function dedupeKey(offer: RawFlightOffer): string {
  const depHour = offer.departureAt.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const flightNum = offer.flightNumber?.replace(/\s/g, '') ?? `${offer.airlineCode}-NOFLIGHT`;
  return `${offer.airlineCode.toUpperCase()}-${flightNum}-${depHour}`;
}

export interface MergeResult {
  offers:          RawFlightOffer[];
  providerResults: Record<string, { count: number; error?: string }>;
  providersUsed:   string[];
}

export async function mergeSearch(params: SearchParams): Promise<MergeResult> {
  const providers = getActiveProviders();

  // Run all providers in parallel — failures don't abort the others
  const settled = await Promise.allSettled(
    providers.map(p => p.search(params).then(offers => ({ provider: p.name, offers })))
  );

  const providerResults: Record<string, { count: number; error?: string }> = {};
  const providersUsed: string[] = [];

  // Collect all offers, tagged with their source
  const allOffers: Array<RawFlightOffer & { _provider: string }> = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const { provider, offers } = result.value;
      providerResults[provider] = { count: offers.length };
      providersUsed.push(provider);
      for (const o of offers) allOffers.push({ ...o, _provider: provider });
    } else {
      // Find which provider failed
      const idx   = settled.indexOf(result);
      const pName = providers[idx]?.name ?? 'unknown';
      providerResults[pName] = { count: 0, error: result.reason?.message ?? 'Unknown error' };
    }
  }

  // Deduplicate: for each unique key, keep the cheapest offer
  const best = new Map<string, RawFlightOffer & { _provider: string }>();
  for (const offer of allOffers) {
    const key      = dedupeKey(offer);
    const existing = best.get(key);
    if (!existing || offer.priceGbp < existing.priceGbp) {
      best.set(key, offer);
    }
  }

  // Sort by price ascending
  const merged = [...best.values()].sort((a, b) => a.priceGbp - b.priceGbp);

  return { offers: merged, providerResults, providersUsed };
}

// Returns the name tag for display purposes
export function providerSummary(result: MergeResult): string {
  return result.providersUsed.join(' + ');
}
