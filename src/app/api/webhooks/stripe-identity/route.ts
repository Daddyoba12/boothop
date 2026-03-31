import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendKycCompleteEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Identity webhook signature failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const { match_id, user_id, user_role } = session.metadata ?? {};

      if (!match_id || !user_id || !user_role) {
        console.error('Missing metadata on identity session:', session.id);
        return NextResponse.json({ received: true });
      }

      const kycField       = user_role === 'sender' ? 'sender_kyc_status'    : 'traveler_kyc_status';
      const kycVerifiedAt  = user_role === 'sender' ? 'sender_kyc_verified_at': 'traveler_kyc_verified_at';

      // Mark this party as verified
      const { data: match } = await supabase
        .from('matches')
        .update({
          [kycField]:      'verified',
          [kycVerifiedAt]: new Date().toISOString(),
        })
        .eq('id', match_id)
        .select()
        .single();

      if (match) {
        // If BOTH parties are now verified → advance to KYC_COMPLETE
        if (match.sender_kyc_status === 'verified' && match.traveler_kyc_status === 'verified') {
          await supabase
            .from('matches')
            .update({ status: 'kyc_complete' })
            .eq('id', match_id);

          // Notify both parties in-app
          await supabase.from('notifications').insert([
            {
              match_id,
              user_id: match.sender_user_id,
              type:    'kyc_complete',
              message: '✅ Both identities verified. You can now proceed to payment.',
              read:    false,
            },
            {
              match_id,
              user_id: match.traveler_user_id,
              type:    'kyc_complete',
              message: '✅ Both identities verified. Waiting for sender to pay into escrow.',
              read:    false,
            },
          ]);

          // Send Resend emails to both
          const { createClient } = await import('@supabase/supabase-js');
          const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const [{ data: sd }, { data: td }] = await Promise.all([
            admin.auth.admin.getUserById(match.sender_user_id),
            admin.auth.admin.getUserById(match.traveler_user_id),
          ]);
          await Promise.allSettled([
            sd?.user?.email && sendKycCompleteEmail(sd.user.email, sd.user.user_metadata?.full_name || 'there', match_id, 'sender'),
            td?.user?.email && sendKycCompleteEmail(td.user.email, td.user.user_metadata?.full_name || 'there', match_id, 'traveler'),
          ]);

          console.log(`Both KYC verified for match ${match_id}. Status → kyc_complete`);
        } else {
          // Notify the verified party
          await supabase.from('notifications').insert([{
            match_id,
            user_id,
            type:    'kyc_self_verified',
            message: '✅ Your identity is verified. Waiting for the other party.',
            read:    false,
          }]);
        }
      }
    }

    if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const { match_id, user_id, user_role } = session.metadata ?? {};

      if (match_id && user_role) {
        const kycField = user_role === 'sender' ? 'sender_kyc_status' : 'traveler_kyc_status';
        await supabase
          .from('matches')
          .update({ [kycField]: 'failed' })
          .eq('id', match_id);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Identity webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
