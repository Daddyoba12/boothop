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

export async function POST(request: Request) {
  try {
    const { matchId, amount } = await request.json();

    // Get match details
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'BootHop Delivery Service',
              description: `Package delivery via verified traveler`,
            },
            unit_amount: Math.round(amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?match_id=${matchId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
      metadata: {
        match_id: matchId,
        type: 'escrow_payment'
      },
      payment_intent_data: {
        capture_method: 'manual', // Hold funds in escrow
        metadata: {
          match_id: matchId
        }
      }
    });

    // Update match with payment session
    await supabase
      .from('matches')
      .update({ 
        payment_session_id: session.id,
        status: 'payment_pending'
      })
      .eq('id', matchId);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
  }
}
