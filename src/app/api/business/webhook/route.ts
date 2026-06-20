import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendBusinessJobPaymentConfirmedEmail } from '@/lib/email/sendBusinessEmail';
import { sendResendEmail } from '@/lib/resend-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_BUSINESS_WEBHOOK_SECRET;
  const stripeKey     = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    // Secret not yet configured — acknowledge so Stripe doesn't retry
    console.warn('business/webhook: STRIPE_BUSINESS_WEBHOOK_SECRET not set, skipping verification');
    return NextResponse.json({ ok: true });
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
    const updatePayload: Record<string, unknown> = { status: 'review' };

    let jobRow: { email: string; pickup: string; dropoff: string; estimated_price: number | null; metadata: Record<string, unknown> | null } | null = null;

    // Fetch job details for notifications
    const { data: fetchedJob } = await supabase
      .from('business_jobs')
      .select('email, pickup, dropoff, estimated_price, metadata')
      .eq('job_ref', jobRef)
      .maybeSingle();
    jobRow = fetchedJob;

    // Store stripe session ID if column exists
    try {
      await supabase
        .from('business_jobs')
        .update({ ...updatePayload, stripe_session_id: session.id })
        .eq('job_ref', jobRef);
    } catch {
      await supabase
        .from('business_jobs')
        .update(updatePayload)
        .eq('job_ref', jobRef);
    }

    // Send payment confirmed email to client + admin alert
    if (jobRow) {
      const isPriority = session.metadata?.is_priority === 'true';
      const price      = jobRow.estimated_price ?? 0;

      await Promise.allSettled([
        sendBusinessJobPaymentConfirmedEmail({
          to:         jobRow.email,
          jobRef,
          pickup:     jobRow.pickup,
          dropoff:    jobRow.dropoff,
          price,
          isPriority,
        }),
        sendResendEmail({
          from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
          to:      process.env.ADMIN_EMAIL     || 'admin@boothop.com',
          subject: `💳 Payment received — ${jobRef}${isPriority ? ' [PRIORITY]' : ''}`,
          text:    `Payment confirmed for ${jobRef}.\nClient: ${jobRow.email}\nRoute: ${jobRow.pickup} → ${jobRow.dropoff}\nAmount: £${price}\nStatus: under review — assign a carrier.`,
        }),
      ]);
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
