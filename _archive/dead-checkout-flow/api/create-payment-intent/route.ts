import { supabaseAdmin as getSupabaseAdmin } from '@/lib/supabase.admin';
import { NextRequest, NextResponse } from 'next/server';


import { stripe, calculateFees } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await req.json();

    // Fetch match details
    const { data: match, error: matchError } = await supabase
      .from('delivery_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is the hooper
    if (match.hooper_id !== user.id) {
      return NextResponse.json({ error: 'Only the hooper can make payment' }, { status: 403 });
    }

    // Check if payment already exists
    if (match.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Payment already initiated' }, { status: 400 });
    }

    // Calculate fees
    const fees = calculateFees(match.agreed_price);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(fees.hooperPays * 100), // Convert to cents
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        match_id: matchId,
        hooper_id: match.hooper_id,
        booter_id: match.booter_id,
        agreed_price: match.agreed_price.toString(),
      },
      description: `BootHop Delivery - Match ${matchId}`,
    });

    // Update match with payment intent ID
    await supabase
      .from('delivery_matches')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
      })
      .eq('id', matchId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
