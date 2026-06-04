export type DeliveryTier = 'p2p' | 'business' | 'priority';

export interface TierConfig {
  tier: DeliveryTier;
  cost: number;
  locationRequestsPerWindow: number;
  precision: 'city' | 'street' | 'building';
  photoProof: 'optional' | 'required';
  liveGPS: boolean;
  notifications: { push: boolean; email: boolean; sms: boolean; phone: boolean };
  support: { responseTime: string; phone: boolean; accountManager: boolean };
  insurance: number;
  auditRetention: number;
  pollTimeoutMs: number;
}

export const TIER_CONFIGS: Record<DeliveryTier, TierConfig> = {
  p2p: {
    tier: 'p2p',
    cost: 0.01,
    locationRequestsPerWindow: 3,
    precision: 'city',
    photoProof: 'optional',
    liveGPS: false,
    notifications: { push: true, email: true, sms: false, phone: false },
    support: { responseTime: '48h', phone: false, accountManager: false },
    insurance: 500,
    auditRetention: 90,
    pollTimeoutMs: 30_000,
  },
  business: {
    tier: 'business',
    cost: 0.05,
    locationRequestsPerWindow: 5,
    precision: 'street',
    photoProof: 'required',
    liveGPS: false,
    notifications: { push: true, email: true, sms: true, phone: false },
    support: { responseTime: '24h', phone: false, accountManager: false },
    insurance: 5000,
    auditRetention: 90,
    pollTimeoutMs: 30_000,
  },
  priority: {
    tier: 'priority',
    cost: 0.10,
    locationRequestsPerWindow: 999,
    precision: 'building',
    photoProof: 'required',
    liveGPS: true,
    notifications: { push: true, email: true, sms: true, phone: true },
    support: { responseTime: '2h', phone: true, accountManager: true },
    insurance: 50_000,
    auditRetention: 365,
    pollTimeoutMs: 60_000,
  },
};

export function getTierConfig(tier: DeliveryTier): TierConfig {
  return TIER_CONFIGS[tier] ?? TIER_CONFIGS.p2p;
}

interface MatchForTier {
  premium_tracking?: boolean;
  sender_priority_partner?: boolean;
  account_type?: string;
  monthly_delivery_count?: number;
  agreed_price?: number;
  pickup_type?: string;
}

export function determineTier(match: MatchForTier): DeliveryTier {
  if (match.premium_tracking) return 'priority';
  if (match.sender_priority_partner) return 'priority';

  let score = 0;
  if (match.account_type === 'business') score++;
  if ((match.monthly_delivery_count ?? 0) >= 5) score++;
  if ((match.agreed_price ?? 0) >= 100) score++;
  if (match.pickup_type === 'airport') score++;
  if ((match.agreed_price ?? 0) >= 500) score++;
  if ((match.monthly_delivery_count ?? 0) >= 20) score++;

  return score >= 3 ? 'business' : 'p2p';
}

export function tierLabel(tier: DeliveryTier): string {
  return { p2p: 'P2P', business: 'Business', priority: 'Priority' }[tier];
}

export function tierColor(tier: DeliveryTier): string {
  return { p2p: '#3b82f6', business: '#f59e0b', priority: '#10b981' }[tier];
}

// Premium tracking add-on pricing per currency
export const PREMIUM_TRACKING_PRICE: Record<string, number> = {
  gbp: 200,   // £2.00 in pence
  usd: 200,   // $2.00 in cents
  eur: 200,   // €2.00 in cents
  ngn: 300000,// ₦3000 in kobo
  aud: 300,   // A$3.00 in cents
  cad: 300,   // C$3.00 in cents
};

export function premiumTrackingPricePence(currency: string): number {
  return PREMIUM_TRACKING_PRICE[currency.toLowerCase()] ?? 200;
}
