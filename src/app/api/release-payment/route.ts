import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

// This should be called by a webhook or scheduled job when both parties confirm
export async function POST(req: NextRequest) {
  try {
    // Verify request (you should add proper authentication here)
    const { matchId } = await req.json();

    // Fetch match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('delivery_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify both parties have confirmed
    if (!match.booter_confirmed_delivery || !match.hooper_confirmed_receipt) {
      return NextResponse.json({ error: 'Both parties must confirm' }, { status: 400 });
    }

    // Check if already released
    if (match.payment_status === 'released') {
      return NextResponse.json({ error: 'Payment already released' }, { status: 400 });
    }

    // Get booter's Stripe account (you'll need to set this up separately)
    // For now, we'll just mark as released - actual transfer requires Stripe Connect
    
    // Update match status
    const { error: updateError } = await supabaseAdmin
      .from('delivery_matches')
      .update({
        payment_status: 'released',
        status: 'completed',
        payment_released_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) throw updateError;

    // TODO: Implement actual Stripe transfer to booter
    // This requires setting up Stripe Connect for booters
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(match.booter_receives * 100),
    //   currency: 'gbp',
    //   destination: booterStripeAccountId,
    //   transfer_group: matchId,
    // });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error releasing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
