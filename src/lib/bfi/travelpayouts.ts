// TravelPayouts affiliate integration
// Marker: 544322
// Every booking URL that goes through these helpers earns commission.

const MARKER = process.env.TRAVELPAYOUTS_MARKER ?? '544322';

// Aviasales search deep link — used as the booking URL for all flight offers.
// Format: https://www.aviasales.com/search/{ORIGIN}{DDMM}{DEST}{ADULTS}?marker=MARKER
export function buildAviasalesUrl(
  origin:      string,
  destination: string,
  departureAt: Date,
  adults = 1,
): string {
  const day   = String(departureAt.getDate()).padStart(2, '0');
  const month = String(departureAt.getMonth() + 1).padStart(2, '0');
  return `https://www.aviasales.com/search/${origin.toUpperCase()}${day}${month}${destination.toUpperCase()}${adults}?marker=${MARKER}`;
}

// Generic TravelPayouts click URL — use when you have a specific campaign/promo
export function buildTpClickUrl(opts: {
  campaignId: string;
  promoId:    string;
  origin?:    string;
  dest?:      string;
}): string {
  const url = new URL('https://tp.media/click');
  url.searchParams.set('shmarker',    MARKER);
  url.searchParams.set('campaign_id', opts.campaignId);
  url.searchParams.set('promo_id',    opts.promoId);
  url.searchParams.set('source_type', 'customlink');
  url.searchParams.set('type',        'click');
  if (opts.origin) url.searchParams.set('origin',      opts.origin);
  if (opts.dest)   url.searchParams.set('destination', opts.dest);
  return url.toString();
}

// Kiwi deep link with TravelPayouts marker injected
export function injectMarker(kiwiDeepLink: string): string {
  if (!kiwiDeepLink) return kiwiDeepLink;
  try {
    const url = new URL(kiwiDeepLink);
    url.searchParams.set('affilid', MARKER);
    return url.toString();
  } catch {
    return kiwiDeepLink;
  }
}

export { MARKER };
