import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendKycVerifiedEmail, sendBothKycVerifiedEmail } from '@/lib/email/sendKycEmail';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });

    const body        = await request.text();
    const headersList = await headers();
    const signature   = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Identity webhook signature failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // ── Verified ────────────────────────────────────────────────────────────────
    if (event.type === 'identity.verification_session.verified') {
      const session                     = event.data.object as Stripe.Identity.VerificationSession;
      const { match_id, email, user_role } = session.metadata ?? {};

      if (!match_id || !email || !user_role) {
        console.error('Missing metadata on identity session:', session.id);
        return NextResponse.json({ received: true });
      }

      const isSender   = user_role === 'sender';
      const kycField   = isSender ? 'sender_kyc_status'    : 'traveler_kyc_status';
      const kycAtField = isSender ? 'sender_kyc_verified_at': 'traveler_kyc_verified_at';

      // Mark this party as verified
      const { data: match } = await supabase
        .from('matches')
        .update({
          [kycField]:   'verified',
          [kycAtField]: new Date().toISOString(),
        })
        .eq('id', match_id)
        .select('id, status, sender_email, traveler_email, agreed_price, sender_kyc_status, traveler_kyc_status, sender_trip:sender_trip_id(from_city, to_city)')
        .single();

      if (!match) {
        console.error('Match not found after KYC update:', match_id);
        return NextResponse.json({ received: true });
      }

      const trip      = (match as any).sender_trip;
      const fromCity  = trip?.from_city ?? '';
      const toCity    = trip?.to_city   ?? '';

      const senderVerified   = isSender   ? true : match.sender_kyc_status   === 'verified';
      const travelerVerified = !isSender  ? true : match.traveler_kyc_status === 'verified';

      if (senderVerified && travelerVerified) {
        // Both verified → advance to kyc_complete
        await supabase
          .from('matches')
          .update({ status: 'kyc_complete' })
          .eq('id', match_id);

        await Promise.allSettled([
          match.sender_email && sendBothKycVerifiedEmail({
            toEmail:     match.sender_email,
            fromCity,
            toCity,
            matchId:     match_id,
            role:        'sender',
            agreedPrice: match.agreed_price ?? 0,
          }),
          match.traveler_email && sendBothKycVerifiedEmail({
            toEmail:     match.traveler_email,
            fromCity,
            toCity,
            matchId:     match_id,
            role:        'traveler',
            agreedPrice: match.agreed_price ?? 0,
          }),
        ]);

        console.log(`Both KYC verified for match ${match_id} → kyc_complete`);
      } else {
        // Just this party — send "waiting for other" email
        await sendKycVerifiedEmail({ toEmail: email, fromCity, toCity, matchId: match_id });
        console.log(`KYC verified for ${email} on match ${match_id} — waiting for other party`);
      }
    }

    // ── Failed / needs more input ───────────────────────────────────────────────
    if (event.type === 'identity.verification_session.requires_input') {
      const session                     = event.data.object as Stripe.Identity.VerificationSession;
      const { match_id, user_role }     = session.metadata ?? {};

      if (match_id && user_role) {
        const kycField = user_role === 'sender' ? 'sender_kyc_status' : 'traveler_kyc_status';
        await supabase
          .from('matches')
          .update({ [kycField]: 'failed' })
          .eq('id', match_id);
        console.log(`KYC failed for match ${match_id}, role ${user_role}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('stripe-identity webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
