  import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' as const });
  }
  return _stripe;
}

// Named export used by existing API routes
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export interface DeliveryFees {
  agreedPrice: number;
  hooperPays: number;
  booterReceives: number;
  platformFee: number;
  hooperFeePercent: number;
  booterFeePercent: number;
}

export function calculateFees(agreedPrice: number): DeliveryFees {
  const hooperFeePercent = 3;
  const booterFeePercent = 5;
  const hooperPays     = Math.round(agreedPrice * (1 + hooperFeePercent / 100) * 100) / 100;
  const booterReceives = Math.round(agreedPrice * (1 - booterFeePercent / 100) * 100) / 100;
  const platformFee    = Math.round((hooperPays - booterReceives) * 100) / 100;
  return { agreedPrice, hooperPays, booterReceives, platformFee, hooperFeePercent, booterFeePercent };
}
