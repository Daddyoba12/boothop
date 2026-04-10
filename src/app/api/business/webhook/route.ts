import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_BUSINESS_WEBHOOK_SECRET;
  const stripeKey     = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    console.error('business/webhook: missing env vars');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' as const });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    console.error('business/webhook: signature failed', err);
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only handle business portal payments
    if (session.metadata?.source !== 'business_portal') {
      return NextResponse.json({ ok: true });
    }

    const jobRef = session.metadata?.job_ref;
    if (!jobRef) {
      console.error('business/webhook: no job_ref in metadata');
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAdminClient();

    // Move job to "review" — payment received, now under BootHop review
    // This gives buffer time while Stripe goes from test → live
    const updatePayload: Record<string, unknown> = { status: 'review' };

    // Store stripe session ID if column exists
    try {
      await supabase
        .from('business_jobs')
        .update({ ...updatePayload, stripe_session_id: session.id })
        .eq('job_ref', jobRef);
    } catch {
      // Column may not exist yet — update status only
      await supabase
        .from('business_jobs')
        .update(updatePayload)
        .eq('job_ref', jobRef);
    }

    console.log(`business/webhook: payment received → job ${jobRef} set to review`);
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.source !== 'business_portal') return NextResponse.json({ ok: true });

    const jobRef = session.metadata?.job_ref;
    if (jobRef) {
      const supabase = createSupabaseAdminClient();
      // Return to pending_payment so user can try again
      await supabase
        .from('business_jobs')
        .update({ status: 'pending_payment' })
        .eq('job_ref', jobRef)
        .eq('status', 'pending_payment'); // only if still waiting
    }
  }

  return NextResponse.json({ ok: true });
}
