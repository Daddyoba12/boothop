import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const INSURANCE_RATE = 0.075; // 7.5%

export async function POST(request: Request) {
  try {
    const { matchId, amount, goodsValue, termsAccepted, insuranceAccepted } = await request.json();

    if (!termsAccepted) {
      return NextResponse.json({ error: 'You must accept the Terms & Conditions to proceed.' }, { status: 400 });
    }

    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const deliveryAmount    = Math.round((amount || match.agreed_price || 0) * 100); // pence
    const parsedGoodsValue  = parseFloat(goodsValue) || 0;
    const insuranceAmount   = insuranceAccepted && parsedGoodsValue > 0
      ? Math.round(parsedGoodsValue * INSURANCE_RATE * 100)
      : 0;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'BootHop Delivery Service',
            description: `Peer-to-peer delivery via verified traveller`,
          },
          unit_amount: deliveryAmount,
        },
        quantity: 1,
      },
    ];

    if (insuranceAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'BootHop Delivery Protection',
            description: `7.5% of declared goods value (£${parsedGoodsValue.toFixed(2)})`,
          },
          unit_amount: insuranceAmount,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/succes?match_id=${matchId}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/kyc/${matchId}`,
      metadata: {
        match_id:         matchId,
        type:             'escrow_payment',
        goods_value:      parsedGoodsValue.toString(),
        insurance_amount: (insuranceAmount / 100).toString(),
        terms_accepted:   'true',
      },
      payment_intent_data: {
        capture_method: 'manual', // Hold funds in escrow
        metadata: {
          match_id: matchId,
        },
      },
    });

    // Record acceptance + insurance details on match
    await supabase
      .from('matches')
      .update({
        payment_session_id:  session.id,
        status:              'payment_pending',
        terms_accepted:      true,
        insurance_accepted:  insuranceAccepted,
        goods_value:         parsedGoodsValue || null,
        insurance_amount:    insuranceAmount / 100 || null,
      })
      .eq('id', matchId);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
  }
}
