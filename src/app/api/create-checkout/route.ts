import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables at module load
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in environment variables');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',  // ← Keep this version!
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const INSURANCE_RATE = 0.075; // 7.5%
const MINIMUM_PAYMENT = 30; // 30 pence minimum for Stripe

export async function POST(request: Request) {
  try {
    const { matchId, amount, goodsValue, termsAccepted, insuranceAccepted } = await request.json();

    // Validate terms acceptance
    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the Terms & Conditions to proceed.' },
        { status: 400 }
      );
    }

    // Authentication check - Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch match with error handling
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('Match fetch error:', matchError);
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Authorization check - ensure user owns this match
    if (match.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to make payment for this match' },
        { status: 403 }
      );
    }

    // Status check - prevent duplicate payments
    if (!['pending', 'matched'].includes(match.status)) {
      return NextResponse.json(
        { error: 'This match is already in payment process or completed' },
        { status: 409 }
      );
    }

    // Calculate delivery amount
    const deliveryAmount = Math.round((amount || match.agreed_price || 0) * 100); // pence

    // Validate delivery amount
    if (deliveryAmount <= 0 || !Number.isFinite(deliveryAmount)) {
      return NextResponse.json(
        { error: 'Invalid delivery amount' },
        { status: 400 }
      );
    }

    // Parse and validate goods value
    const parsedGoodsValue = parseFloat(goodsValue) || 0;

    // Validate goods value if insurance is selected
    if (insuranceAccepted && (parsedGoodsValue <= 0 || !Number.isFinite(parsedGoodsValue))) {
      return NextResponse.json(
        { error: 'Valid goods value is required when selecting insurance' },
        { status: 400 }
      );
    }

    // Calculate insurance amount
    const insuranceAmount = insuranceAccepted && parsedGoodsValue > 0
      ? Math.round(parsedGoodsValue * INSURANCE_RATE * 100)
      : 0;

    // Validate total amount meets Stripe minimum
    const totalAmount = deliveryAmount + insuranceAmount;
    if (totalAmount < MINIMUM_PAYMENT) {
      return NextResponse.json(
        { error: `Payment amount must be at least £${(MINIMUM_PAYMENT / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Build line items
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?match_id=${matchId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/kyc/${matchId}`,
      metadata: {
        match_id: matchId,
        type: 'escrow_payment',
        goods_value: parsedGoodsValue.toString(),
        insurance_amount: (insuranceAmount / 100).toString(),
        terms_accepted: 'true',
        sender_id: user.id,
      },
      payment_intent_data: {
        capture_method: 'manual', // Hold funds in escrow
        metadata: {
          match_id: matchId,
          sender_id: user.id,
        },
      },
    });

    // Update match record with payment details
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        payment_session_id: session.id,
        status: 'payment_pending',
        terms_accepted: true,
        insurance_accepted: insuranceAccepted,
        goods_value: parsedGoodsValue || null,
        insurance_amount: insuranceAmount / 100 || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Match update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update match record. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'Payment creation failed. Please try again.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
