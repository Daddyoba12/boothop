import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const PLATFORM_FEE_RATE = 0.05;
const INSURANCE_RATE    = 0.08;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' as any });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, goodsValue, insuranceAccepted } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.sender_email !== email) {
      return NextResponse.json({ error: 'Only the sender can initiate payment.' }, { status: 403 });
    }

    if (!['kyc_complete', 'payment_pending'].includes(match.status)) {
      return NextResponse.json({ error: 'Match is not ready for payment.' }, { status: 400 });
    }

    const agreedPrice   = match.agreed_price ?? 0;
    const parsedGoods   = parseFloat(goodsValue) || 0;
    const insuranceFee  = insuranceAccepted && parsedGoods > 0 ? parsedGoods * INSURANCE_RATE : 0;
    const platformFee   = agreedPrice * PLATFORM_FEE_RATE;
    const carrierPayout = agreedPrice * 0.97;

    const trip     = Array.isArray((match as any).sender_trip) ? (match as any).sender_trip[0] : (match as any).sender_trip;
    const fromCity = trip?.from_city   ?? '';
    const toCity   = trip?.to_city     ?? '';

    // Record payment details + mark processing
    await supabase
      .from('matches')
      .update({
        status:             'payment_processing',
        goods_value:        parsedGoods || null,
        insurance_fee:      insuranceFee || null,
        insurance_accepted: insuranceAccepted,
        carrier_payout:     carrierPayout,
        platform_fee:       platformFee,
      })
      .eq('id', matchId);

    const stripe  = getStripe();
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

    // Total charge in pence (delivery + platform fee; insurance added separately below)
    const totalChargePence = Math.round((agreedPrice + platformFee) * 100);

    // Check if sender has an unspent signup credit — apply it (max: full charge amount)
    let signupCreditApplied = 0;
    try {
      const { data: creditRow } = await supabase
        .from('signup_credits')
        .select('amount_pence, redeemed')
        .eq('email', email)
        .eq('redeemed', false)
        .maybeSingle();
      if (creditRow) {
        signupCreditApplied = Math.min(creditRow.amount_pence, totalChargePence);
      }
    } catch { /* graceful */ }

    const finalChargePence = totalChargePence - signupCreditApplied;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency:     'gbp',
          product_data: { name: `BootHop delivery: ${fromCity} → ${toCity}` },
          unit_amount:  finalChargePence,
        },
        quantity: 1,
      },
    ];

    if (insuranceFee > 0) {
      lineItems.push({
        price_data: {
          currency:     'gbp',
          product_data: { name: `Goods insurance (8%) — declared £${parsedGoods.toFixed(2)}` },
          unit_amount:  Math.round(insuranceFee * 100),
        },
        quantity: 1,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:  lineItems,
      mode:        'payment',
      success_url: `${appUrl}/payment/succes?match_id=${matchId}`,
      cancel_url:  `${appUrl}/kyc?matchId=${matchId}`,
      customer_email: email,
      metadata: {
        match_id:              matchId,
        sender_email:          email,
        signup_credit_applied: signupCreditApplied > 0 ? String(signupCreditApplied) : '',
      },
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });

  } catch (error) {
    console.error('payment/create-checkout error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
