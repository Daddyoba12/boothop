import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' as any });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const email   = session.email.toLowerCase().trim();
    const supabase = createSupabaseAdminClient();

    const { data: match, error } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, payment_intent_id, sender_confirmed_delivery, traveller_confirmed_delivery')
      .eq('id', matchId)
      .maybeSingle();

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (!['active', 'escrowed'].includes(match.status)) {
      return NextResponse.json({ error: 'Match is not in an active delivery state.' }, { status: 400 });
    }

    const isSender    = match.sender_email?.toLowerCase()   === email;
    const isTraveller = match.traveler_email?.toLowerCase() === email;

    if (!isSender && !isTraveller) {
      return NextResponse.json({ error: 'Not a participant in this match.' }, { status: 403 });
    }

    const update: Record<string, boolean> = {};
    if (isSender)    update.sender_confirmed_delivery    = true;
    if (isTraveller) update.traveller_confirmed_delivery = true;

    await supabase.from('matches').update(update).eq('id', matchId);

    // Re-fetch to check if both have now confirmed
    const { data: updated } = await supabase
      .from('matches')
      .select('sender_confirmed_delivery, traveller_confirmed_delivery, payment_intent_id')
      .eq('id', matchId)
      .single();

    const bothConfirmed = !!(updated?.sender_confirmed_delivery && updated?.traveller_confirmed_delivery);

    if (bothConfirmed && updated?.payment_intent_id) {
      // Both parties confirmed — release escrow by capturing the payment
      // charge.captured webhook fires → stripe.transfers.create → traveller paid → transfer.created → completed
      const stripe = getStripe();
      await stripe.paymentIntents.capture(updated.payment_intent_id);
    }

    return NextResponse.json({
      ok: true,
      senderConfirmed:    updated?.sender_confirmed_delivery    ?? false,
      travellerConfirmed: updated?.traveller_confirmed_delivery ?? false,
      bothConfirmed,
      message: bothConfirmed
        ? 'Both parties confirmed — payment is being released to the traveller.'
        : 'Confirmation recorded. Waiting for the other party.',
    });

  } catch (err) {
    console.error('confirm-delivery error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
