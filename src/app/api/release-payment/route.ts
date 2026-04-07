import { NextResponse } from 'next/server';

// Stripe-based release is not active. Payment release is handled manually by admin
// via /api/admin/release-payment after both parties confirm delivery.
export async function POST() {
  return NextResponse.json({ ok: true, message: 'Payment release handled manually.' });
}
