// BootHop Business — Pricing Engine v2
// All prices in GBP. Matches the April 2026 pricing framework document.

export type RouteType    = 'uk_uk' | 'uk_eu' | 'eu_uk' | 'uk_intl';
export type DeliveryMode = 'airport_airport' | 'airport_door' | 'door_airport' | 'door_door';
export type UrgencyTier  = 'planned' | 'priority' | 'critical';

export interface QuoteInput {
  routeType:        RouteType;
  deliveryMode:     DeliveryMode;
  urgency:          UrgencyTier;
  extraPickupMiles: number;   // miles beyond included (or beyond nearest airport for intl)
  extraDropMiles:   number;
  weightKg:         number;
  declaredValue:    number;   // GBP
  enhancedInsurance: boolean;
  nightService:     boolean;  // collection/delivery between 22:00–06:00
  weekend:          boolean;  // Saturday or Sunday
  dedicatedDriver:  boolean;
  immediateDispatch: boolean;
  meetGreetOrigin:  boolean;  // airport meet & greet at origin side
  meetGreetDest:    boolean;  // airport meet & greet at destination side
}

export interface QuoteBreakdown {
  base:             number;
  pickupExtra:      number;
  dropExtra:        number;
  handlingFee:      number;   // meet & greet fees
  insuranceFee:     number;
  addons:           number;   // night / immediate / dedicated / weight uplift
  weekendSurcharge: number;
  total:            number;
  reviewRequired:   boolean;
  reviewReasons:    string[];
}

// ── Rate tables ───────────────────────────────────────────────────────────────

const BASE: Record<RouteType, Record<UrgencyTier, number>> = {
  uk_uk:  { planned: 300,  priority: 700,  critical: 1200 },
  uk_eu:  { planned: 1000, priority: 1500, critical: 2500 },
  eu_uk:  { planned: 1000, priority: 1500, critical: 2500 },
  uk_intl:{ planned: 2000, priority: 4000, critical: 7000 },
};

// UK-UK: first 50 miles included, then per-mile charge
const INCLUDED_UK_MILES  = 50;
const MILE_RATE_STANDARD = 3.00;   // planned
const MILE_RATE_URGENT   = 6.50;   // priority / critical

// Airport handling: per end, meet & greet service
const AIRPORT_HANDLING_FEE = 175;

// Weight bands (10–20 kg uplift)
const WEIGHT_UPLIFT_KG_THRESHOLD = 10;
const WEIGHT_UPLIFT_FEE          = 100;

// Add-on fees
const FEE_IMMEDIATE_DISPATCH = 200;
const FEE_NIGHT_SERVICE      = 200;
const FEE_DEDICATED_DRIVER   = 300;
const WEEKEND_MULTIPLIER     = 0.20;

// Insurance
const INSURANCE_FREE_LIMIT     = 1000;   // standard cover up to £1k included
const INSURANCE_RATE           = 0.05;   // 5% of declared value
const INSURANCE_MINIMUM        = 75;

// ── Core calculator ──────────────────────────────────────────────────────────

export function calculateQuote(input: QuoteInput): QuoteBreakdown {
  const reviewReasons: string[] = [];
  if (input.weightKg > 20)                                  reviewReasons.push('Weight above 20 kg — custom assessment required');
  if (input.declaredValue > 50_000)                         reviewReasons.push('Declared value above £50,000 — specialist cover required');
  if (input.routeType === 'uk_intl' && input.urgency === 'critical') reviewReasons.push('Critical international allocation — manual confirmation required');

  const base      = BASE[input.routeType][input.urgency];
  const mileRate  = input.urgency === 'planned' ? MILE_RATE_STANDARD : MILE_RATE_URGENT;

  // Extra pickup miles
  let pickupExtra = 0;
  if (input.routeType === 'uk_uk') {
    const billable = Math.max(0, input.extraPickupMiles - INCLUDED_UK_MILES);
    pickupExtra    = Math.round(billable * mileRate);
  } else {
    pickupExtra    = Math.round(input.extraPickupMiles * mileRate);
  }

  // Extra drop miles
  const dropExtra = Math.round(input.extraDropMiles * mileRate);

  // Airport handling (international routes only)
  let handlingFee = 0;
  if (input.routeType !== 'uk_uk') {
    if (input.meetGreetOrigin) handlingFee += AIRPORT_HANDLING_FEE;
    if (input.meetGreetDest)   handlingFee += AIRPORT_HANDLING_FEE;
  }

  // Insurance
  let insuranceFee = 0;
  if (input.enhancedInsurance && input.declaredValue > INSURANCE_FREE_LIMIT) {
    insuranceFee = Math.max(INSURANCE_MINIMUM, Math.round(input.declaredValue * INSURANCE_RATE));
  }

  // Weight uplift (10–20 kg)
  let weightUplift = 0;
  if (input.weightKg >= WEIGHT_UPLIFT_KG_THRESHOLD && input.weightKg <= 20) {
    weightUplift = WEIGHT_UPLIFT_FEE;
  }

  // Add-ons
  let addons = weightUplift;
  if (input.immediateDispatch) addons += FEE_IMMEDIATE_DISPATCH;
  if (input.nightService)      addons += FEE_NIGHT_SERVICE;
  if (input.dedicatedDriver)   addons += FEE_DEDICATED_DRIVER;

  const subtotal = base + pickupExtra + dropExtra + handlingFee + insuranceFee + addons;

  const weekendSurcharge = input.weekend ? Math.round(subtotal * WEEKEND_MULTIPLIER) : 0;

  return {
    base,
    pickupExtra,
    dropExtra,
    handlingFee,
    insuranceFee,
    addons,
    weekendSurcharge,
    total:          subtotal + weekendSurcharge,
    reviewRequired: reviewReasons.length > 0,
    reviewReasons,
  };
}

// ── Display metadata ─────────────────────────────────────────────────────────

export const ROUTE_META: Record<RouteType, { label: string; flag: string; from: string; desc: string }> = {
  uk_uk:  { label: 'UK → UK',     flag: '🇬🇧', from: 'from £300',   desc: 'Same-day or express domestic delivery' },
  uk_eu:  { label: 'UK → EU',     flag: '🇪🇺', from: 'from £1,000', desc: 'Hand-carry via air or rail to Europe' },
  eu_uk:  { label: 'EU → UK',     flag: '🇬🇧', from: 'from £1,000', desc: 'Inbound hand-carry from Europe' },
  uk_intl:{ label: 'UK → Global', flag: '🌍', from: 'from £2,000', desc: 'International hand-carry, any destination' },
};

export const MODE_META: Record<DeliveryMode, { label: string; desc: string; recommended?: boolean }> = {
  airport_airport: { label: 'Airport → Airport', desc: 'Fastest and most cost-efficient. You handle local movement at both ends.', recommended: true },
  airport_door:    { label: 'Airport → Door',    desc: 'We collect from origin airport and deliver direct to destination address.' },
  door_airport:    { label: 'Door → Airport',    desc: 'We collect from your address and hand off at destination airport.' },
  door_door:       { label: 'Door → Door',       desc: 'Full door-to-door collection and delivery. Extra mileage billed separately.' },
};

export const URGENCY_META: Record<UrgencyTier, { label: string; time: string; desc: string; color: string }> = {
  planned:  { label: 'Express (Planned)', time: '3–6 hour window',   desc: 'Same-day, booked in advance. Best value.',          color: 'green'  },
  priority: { label: 'Priority',          time: '1–3 hour response', desc: 'Elevated handling. Rapid operator assignment.',     color: 'blue'   },
  critical: { label: 'Critical',          time: 'Immediate dispatch', desc: 'We move now. Highest priority, any time of day.', color: 'red'    },
};

export const CATEGORIES = [
  'Engineering components',
  'Aerospace parts',
  'Automotive parts',
  'Electronics / PCBs',
  'Medical equipment',
  'Industrial tooling',
  'Documents / contracts',
  'High-value goods',
  'Other',
];
