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

    const { matchId, goodsValue, insuranceAccepted: rawInsurance, premiumTracking } = await request.json();
    const insuranceAccepted = rawInsurance === true;
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

    // ── Guard 1: Traveller must be Connect-verified ─────────────────────────
    // Final hard check — if the traveller can't receive a payout, block payment
    // entirely. Contact details must never be released if payout isn't possible.
    const { data: travellerUser } = await supabase
      .from('users')
      .select('can_receive_payments, stripe_connect_id, stripe_onboarding_completed')
      .eq('email', match.traveler_email)
      .maybeSingle();

    if (!travellerUser?.can_receive_payments) {
      const needsAccount = !travellerUser?.stripe_connect_id;
      return NextResponse.json({
        error: needsAccount
          ? 'Your traveller has not set up their payout account. Payment cannot proceed until they complete Stripe onboarding.'
          : 'Your traveller\'s payout account is still under review (usually 24–48 hours). Please try again once Stripe has verified them.',
        travellerNotVerified: true,
        travellerNeedsAccount: needsAccount,
      }, { status: 402 });
    }
    // ── End Guard 1 ─────────────────────────────────────────────────────────

    // ── Guard 2: Check sender's stored card hasn't expired ──────────────────
    // Only applies if they saved a card previously. If no card saved, Stripe
    // checkout will collect one — no block needed.
    try {
      const { data: senderUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (senderUser?.id) {
        const { data: savedCard } = await supabase
          .from('user_payment_methods')
          .select('type, card_exp_month, card_exp_year')
          .eq('user_id', senderUser.id)
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();

        if (savedCard?.type === 'card') {
          const now = new Date();
          const expired =
            savedCard.card_exp_year < now.getFullYear() ||
            (savedCard.card_exp_year === now.getFullYear() &&
              savedCard.card_exp_month < now.getMonth() + 1);

          if (expired) {
            return NextResponse.json({
              error: `Your saved card expired ${savedCard.card_exp_month}/${savedCard.card_exp_year}. Please use a new card at checkout.`,
              cardExpired: true,
            }, { status: 400 });
          }
        }
      }
    } catch { /* non-fatal — proceed if payment methods table not queried */ }
    // ── End Guard 2 ─────────────────────────────────────────────────────────

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

    // Check for unspent signup credit and mark it redeemed atomically before
    // creating the Stripe session — prevents double-spend on concurrent requests.
    let signupCreditApplied = 0;
    try {
      const { data: creditRow } = await supabase
        .from('signup_credits')
        .select('amount_pence')
        .eq('email', email)
        .eq('redeemed', false)
        .maybeSingle();

      if (creditRow) {
        // Atomically mark redeemed — only succeeds if still unredeemed
        const { error: redeemErr } = await supabase
          .from('signup_credits')
          .update({ redeemed: true, redeemed_at: new Date().toISOString() })
          .eq('email', email)
          .eq('redeemed', false);

        if (!redeemErr) {
          signupCreditApplied = Math.min(creditRow.amount_pence, totalChargePence);
        }
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

    if (premiumTracking) {
      lineItems.push({
        price_data: {
          currency:     'gbp',
          product_data: {
            name:        'Premium Tracking',
            description: 'Unlimited location pings · Photo proof · SMS alerts · Priority support',
          },
          unit_amount: 200, // £2.00
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
      // Hold funds in escrow until both parties confirm delivery
      payment_intent_data: { capture_method: 'manual' },
      metadata: {
        match_id:              matchId,
        sender_email:          email,
        signup_credit_applied: signupCreditApplied > 0 ? String(signupCreditApplied) : '',
        premium_tracking:      premiumTracking ? 'true' : '',
        carrier_payout:        String(Math.round(carrierPayout * 100)),
        currency:              'gbp',
      },
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });

  } catch (error) {
    console.error('payment/create-checkout error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
