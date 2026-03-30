import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover' as const,
});

// Calculate fees
export function calculateFees(agreedPrice: number) {
  const hooperFeePercentage = 3; // 3%
  const booterFeePercentage = 5; // 5%
  
  const hooperPays = agreedPrice * (1 + hooperFeePercentage / 100);
  const booterReceives = agreedPrice * (1 - booterFeePercentage / 100);
  const platformFee = hooperPays - booterReceives;

  return {
    agreedPrice,
    hooperPays: Math.round(hooperPays * 100) / 100, // Round to 2 decimals
    booterReceives: Math.round(booterReceives * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    hooperFeePercentage,
    booterFeePercentage,
  };
}
