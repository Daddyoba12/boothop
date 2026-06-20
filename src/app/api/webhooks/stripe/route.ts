import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { sendResendEmail } from '@/lib/resend-client';
import { sendDeliveryCompleteEmail } from '@/lib/email/sendDeliveryEmail';
import {
  getWebhookEventStatus,
  setWebhookEventStatus,
  pushFailedEvent,
} from '@/lib/redis';

// ============================================================================
// ELITE STRIPE WEBHOOK HANDLER
// ============================================================================

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover', typescript: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars');
    _supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return _supabase;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = new Proxy({} as any, {
  get(_t, prop) { return getSupabase()[prop]; },
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const stripe = getStripeClient();
  let capturedEventId: string | undefined;

  try {
    const body = await request.text();
    
     const headersList = await headers();
const signature = headersList.get('stripe-signature');
    

    // ── Internal retry bypass (from process-webhook-queue cron) ─────────────
    const bypassHeader = headersList.get('x-internal-bypass');
    const cronSecret   = process.env.CRON_SECRET;
    const isInternalRetry = bypassHeader && cronSecret && bypassHeader === cronSecret;

    // Verify webhook signature (skip for internal retries)
    let event: Stripe.Event;
    if (isInternalRetry) {
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (err: any) {
        return NextResponse.json({ error: 'Invalid event body' }, { status: 400 });
      }
    } else {
      if (!signature) {
        console.error('❌ Missing Stripe signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        await logWebhookError('signature_verification_failed', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // ── Redis idempotency check ──────────────────────────────────────────────
    capturedEventId = event.id;
    const existingStatus = await getWebhookEventStatus(event.id);
    if (existingStatus === 'processed') {
      console.log(`⏭️  Skipping duplicate event ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Mark as processing (prevents concurrent duplicates via 5-min lock)
    await setWebhookEventStatus(event.id, 'processing');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 Webhook Event Received: ${event.type}`);
    console.log(`📋 Event ID: ${event.id}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Route to appropriate handler
    let result;
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        result = await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.captured':
        result = await handleChargeCaptured(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'payment_intent.canceled':
        result = await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        result = await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
        result = { handled: false, message: 'Event type not handled' };
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Webhook processed successfully in ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);

    // Mark event as fully processed in Redis (7-day dedup window)
    await setWebhookEventStatus(event.id, 'processed');

    // Log successful webhook
    await logWebhookEvent(event.type, event.id, 'success', result);

    return NextResponse.json({
      received: true,
      processed: true,
      eventType: event.type,
      duration: `${duration}ms`
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Webhook processing failed after ${duration}ms:`, error);

    // Track in Redis for retry
    if (capturedEventId) {
      await setWebhookEventStatus(capturedEventId, 'failed');
      await pushFailedEvent(capturedEventId);
    }

    await logWebhookError('processing_failed', error.message);

    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle successful checkout session completion.
 * Auto-activates the match and releases contact details to both parties.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout completion...');

  const matchId = session.metadata?.match_id;

  if (!matchId) {
    console.error('❌ No match_id in session metadata');
    throw new Error('Missing match_id in session metadata');
  }

  // Fetch match using email-based model (BootHop uses custom JWT sessions, not Supabase Auth)
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
    .eq('id', matchId)
    .single();

  if (!match) {
    console.error(`❌ Match ${matchId} not found`);
    throw new Error('Match not found');
  }

  if (match.status === 'active' || match.status === 'escrowed') {
    console.log(`ℹ️  Match ${matchId} already escrowed — skipping`);
    return { success: true, matchId, skipped: true };
  }

  // Set premium_tracking flag before activating
  const premiumTracking = session.metadata?.premium_tracking === 'true';

  // Hold match in escrowed state — funds are secured but not yet captured
  await supabase
    .from('matches')
    .update({
      status:               'escrowed',
      payment_intent_id:    session.payment_intent as string,
      stripe_session_id:    session.id,
      payment_confirmed_at: new Date().toISOString(),
      premium_tracking:     premiumTracking,
    })
    .eq('id', matchId);

  // Record in transactions ledger
  await supabase.from('transactions').insert({
    match_id:                 matchId,
    stripe_session_id:        session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_total:             session.amount_total,
    currency:                 session.currency,
    status:                   'escrowed',
    sender_email:             match.sender_email,
    traveller_email:          match.traveler_email,
  }).catch(() => {});

  console.log(`✅ Match ${matchId} escrowed — £${(session.amount_total ?? 0) / 100}${premiumTracking ? ' [Premium Tracking]' : ''}`);

  // Mark signup credit as redeemed if one was applied at checkout
  const creditApplied = session.metadata?.signup_credit_applied;
  if (creditApplied && parseInt(creditApplied) > 0) {
    await supabase
      .from('signup_credits')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('email', match.sender_email)
      .eq('redeemed', false);
    console.log(`🎁 £${parseInt(creditApplied) / 100} signup credit redeemed for ${match.sender_email}`);
  }

  // Release contact details to both parties
  const { sendContactReleasedEmail } = await import('@/lib/email/sendPaymentEmail');
  const trip       = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
  const fromCity   = (trip as any)?.from_city   ?? '';
  const toCity     = (trip as any)?.to_city     ?? '';
  const travelDate = (trip as any)?.travel_date ?? '';

  await Promise.allSettled([
    sendContactReleasedEmail({
      toEmail:    match.sender_email,
      fromCity,   toCity,   travelDate,
      matchId,
      otherEmail: match.traveler_email,
      role:       'sender',
    }),
    sendContactReleasedEmail({
      toEmail:    match.traveler_email,
      fromCity,   toCity,   travelDate,
      matchId,
      otherEmail: match.sender_email,
      role:       'traveler',
    }),
  ]);

  // Generate tracking barcodes asynchronously — does not block checkout confirmation
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/generate-barcodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId }),
  }).catch(err => console.error('Barcode generation failed:', err));

  return {
    success: true,
    matchId,
    amount:   (session.amount_total ?? 0) / 100,
    currency: session.currency,
    premiumTracking,
  };
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('✅ Payment intent succeeded');
  console.log(`💰 Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
  console.log(`🆔 Payment Intent ID: ${paymentIntent.id}`);

  const matchId = paymentIntent.metadata?.match_id;

  if (matchId) {
    // Update payment timestamp
    await supabase
      .from('matches')
      .update({
        payment_succeeded_at: new Date().toISOString()
      })
      .eq('id', matchId);
  }

  return {
    success: true,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100
  };
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error('❌ Payment failed');
  console.error(`🆔 Payment Intent ID: ${paymentIntent.id}`);
  console.error(`💬 Failure message: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);

  const matchId = paymentIntent.metadata?.match_id;

  if (matchId) {
    // Update match status
    const { error } = await supabase
      .from('matches')
      .update({
        payment_status: 'failed',
        payment_failed_at: new Date().toISOString(),
        payment_failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error'
      })
      .eq('id', matchId);

    if (error) {
      console.error('❌ Failed to update match:', error);
    }

    // Notify sender about payment failure
    await sendPaymentFailureNotification(matchId);
  }

  return {
    success: false,
    paymentIntentId: paymentIntent.id,
    failureReason: paymentIntent.last_payment_error?.message
  };
}

/**
 * Handle charge capture (escrow release)
 * This occurs when admin manually releases funds or both parties confirm
 */
async function handleChargeCaptured(charge: Stripe.Charge) {
  console.log('💸 Processing charge capture (escrow release)...');
  console.log(`💰 Amount: ${charge.amount / 100} ${charge.currency.toUpperCase()}`);

  const paymentIntentId = charge.payment_intent as string;

  try {
    // Find match by payment_intent_id
    const { data: match, error: selectError } = await supabase
      .from('matches')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (selectError || !match) {
      console.error('❌ Match not found for payment intent:', paymentIntentId);
      throw new Error('Match not found');
    }

    // Mark escrow as released — status moves to completed only after transfer.created fires
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        payment_status:      'released',
        payment_released_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    if (updateError) {
      console.error('❌ Failed to update match:', updateError);
      throw updateError;
    }

    // Initiate Stripe Connect transfer to traveller's payout account
    const { data: travellerUser } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('email', match.traveler_email)
      .maybeSingle();

    if (travellerUser?.stripe_connect_id) {
      const transferAmount   = Math.round((match.carrier_payout ?? 0) * 100);
      const transferCurrency = match.currency ?? 'gbp';
      if (transferAmount > 0) {
        const stripe = getStripeClient();
        await stripe.transfers.create({
          amount:      transferAmount,
          currency:    transferCurrency,
          destination: travellerUser.stripe_connect_id,
          metadata:    { match_id: match.id },
        });
        console.log(`💸 Transfer of ${transferCurrency.toUpperCase()} ${transferAmount / 100} initiated to ${travellerUser.stripe_connect_id}`);
      }
    } else {
      console.warn(`⚠️  No stripe_connect_id for traveller ${match.traveler_email} — transfer skipped`);
    }

    console.log(`✅ Escrow released for match ${match.id}`);

    return {
      success: true,
      matchId: match.id,
      amountReleased: charge.amount / 100
    };

  } catch (error: any) {
    console.error('❌ Error in handleChargeCaptured:', error);
    throw error;
  }
}

/**
 * Handle charge refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('🔄 Processing refund...');
  console.log(`💰 Refund amount: ${charge.amount_refunded / 100} ${charge.currency.toUpperCase()}`);

  const paymentIntentId = charge.payment_intent as string;

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (match) {
    await supabase
      .from('matches')
      .update({
        payment_status: 'refunded',
        payment_refunded_at: new Date().toISOString(),
        refund_amount: charge.amount_refunded / 100
      })
      .eq('id', match.id);

    console.log(`✅ Refund processed for match ${match.id}`);

    // Notify both parties
    await sendRefundNotifications(match.id);
  }

  return {
    success: true,
    refundAmount: charge.amount_refunded / 100
  };
}

/**
 * Handle payment cancellation
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('🚫 Payment canceled');

  const matchId = paymentIntent.metadata?.match_id;

  if (matchId) {
    await supabase
      .from('matches')
      .update({
        payment_status: 'canceled',
        payment_canceled_at: new Date().toISOString()
      })
      .eq('id', matchId);

    console.log(`✅ Payment cancellation recorded for match ${matchId}`);
  }

  return {
    success: true,
    paymentIntentId: paymentIntent.id
  };
}

/**
 * Handle Stripe Connect transfer confirmation.
 * Fires after stripe.transfers.create succeeds — money is now on its way to the traveller.
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log('✅ Transfer created — completing match...');
  const matchId = transfer.metadata?.match_id;
  if (!matchId) return { success: true, transferId: transfer.id, matchId: null };

  await supabase
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId);

  // Update transactions ledger
  await supabase
    .from('transactions')
    .update({ status: 'transferred', stripe_transfer_id: transfer.id, updated_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .catch(() => {});

  await sendDeliveryCompletionEmails(matchId);
  await createMatchNotifications(matchId, 'delivery_completed');

  console.log(`✅ Match ${matchId} completed — transfer ${transfer.id}`);
  return { success: true, transferId: transfer.id, matchId };
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

async function sendPaymentConfirmationEmails(matchId: string, customerEmail?: string | null) {
  console.log(`📧 Sending payment confirmation emails for match ${matchId}`);

  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      sender_trip:sender_trip_id(from_city, to_city, travel_date, user_id),
      traveler_trip:traveler_trip_id(from_city, to_city, travel_date, user_id)
    `)
    .eq('id', matchId)
    .single();

  if (!match) return;

  // Fetch user emails via admin API
  const { createClient: mkClient } = await import('@supabase/supabase-js');
  const admin = mkClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: senderData }, { data: travelerData }] = await Promise.all([
    admin.auth.admin.getUserById(match.sender_trip?.user_id),
    admin.auth.admin.getUserById(match.traveler_trip?.user_id),
  ]);

  const route    = `${match.sender_trip?.from_city} → ${match.sender_trip?.to_city}`;
  const date     = match.sender_trip?.travel_date || '';
  const amount   = `£${match.agreed_price || match.hooper_pays || 0}`;

  await Promise.allSettled([
    senderData?.user?.email && sendPaymentConfirmationEmail({
      to:           senderData.user.email,
      name:         senderData.user.user_metadata?.full_name || 'there',
      amount,
      role:         'sender',
      from:         match.sender_trip?.from_city,
      to_location:  match.sender_trip?.to_city,
      transactionId: matchId,
      date,
    }),
    travelerData?.user?.email && sendPaymentConfirmationEmail({
      to:           travelerData.user.email,
      name:         travelerData.user.user_metadata?.full_name || 'there',
      amount:       `£${match.carrier_payout || 0}`,
      role:         'traveler',
      from:         match.traveler_trip?.from_city,
      to_location:  match.traveler_trip?.to_city,
      transactionId: matchId,
      date,
    }),
  ]);
}

async function sendPaymentFailureNotification(matchId: string) {
  const { data: match } = await supabase
    .from('matches')
    .select('sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
    .eq('id', matchId)
    .single();
  if (!match) return;
  const trip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
  const from = 'BootHop <noreply@boothop.com>';
  await Promise.allSettled([
    match.sender_email && sendResendEmail({
      from, to: match.sender_email,
      subject: 'Payment failed — action required',
      html: `<p>Your payment for the <strong>${trip?.from_city} → ${trip?.to_city}</strong> delivery could not be processed. Please retry via the BootHop dashboard.</p>`,
      text: `Your payment for ${trip?.from_city} → ${trip?.to_city} failed. Please retry via https://www.boothop.com/dashboard`,
    }),
  ]);
}

async function sendDeliveryCompletionEmails(matchId: string) {
  const { data: match } = await supabase
    .from('matches')
    .select('sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
    .eq('id', matchId)
    .single();
  if (!match) return;
  const trip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
  const fromCity = trip?.from_city ?? '';
  const toCity   = trip?.to_city   ?? '';
  await Promise.allSettled([
    match.sender_email && sendDeliveryCompleteEmail({ toEmail: match.sender_email, fromCity, toCity, matchId, role: 'sender' }),
    match.traveler_email && sendDeliveryCompleteEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler' }),
  ]);
}

async function sendRefundNotifications(matchId: string) {
  const { data: match } = await supabase
    .from('matches')
    .select('sender_email, sender_trip:sender_trip_id(from_city, to_city)')
    .eq('id', matchId)
    .single();
  if (!match) return;
  const trip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
  await Promise.allSettled([
    match.sender_email && sendResendEmail({
      from: 'BootHop <noreply@boothop.com>',
      to: match.sender_email,
      subject: 'Your refund is on its way',
      html: `<p>Your payment for the <strong>${trip?.from_city} → ${trip?.to_city}</strong> delivery has been refunded. It should appear within 5–10 business days.</p>`,
      text: `Your payment for ${trip?.from_city} → ${trip?.to_city} has been refunded.`,
    }),
  ]);
}

async function createMatchNotifications(matchId: string, type: string) {
  console.log(`🔔 Creating ${type} notifications for match ${matchId}`);
  
  const { data: match } = await supabase
    .from('matches')
    .select('sender_trip:sender_trip_id(user_id), traveler_trip:traveler_trip_id(user_id)')
    .eq('id', matchId)
    .single();

  if (match) {
    const notifications = [
      {
        match_id: matchId,
        user_id: (match.sender_trip as any)?.user_id,
        type,
        message: getNotificationMessage(type, 'sender'),
        read: false
      },
      {
        match_id: matchId,
        user_id: (match.traveler_trip as any)?.user_id,
        type,
        message: getNotificationMessage(type, 'traveler'),
        read: false
      }
    ];

    await supabase.from('notifications').insert(notifications);
    console.log(`✅ Notifications created`);
  }
}

function getNotificationMessage(type: string, role: string): string {
  const messages: Record<string, Record<string, string>> = {
    payment_escrowed: {
      sender: '✅ Payment secured in escrow. Waiting for delivery confirmation.',
      traveler: '💰 Payment received in escrow. Complete delivery to receive funds.'
    },
    delivery_completed: {
      sender: '🎉 Delivery completed! Thank you for using BootHop.',
      traveler: '💵 Payment released! Funds are on their way to your account.'
    }
  };

  return messages[type]?.[role] || 'Update on your match';
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

async function logWebhookEvent(
  eventType: string, 
  eventId: string, 
  status: string, 
  details: any
) {
  try {
    await supabase.from('webhook_logs').insert({
      event_type: eventType,
      event_id: eventId,
      status,
      details: JSON.stringify(details),
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

async function logWebhookError(errorType: string, errorMessage: string) {
  try {
    await supabase.from('webhook_logs').insert({
      event_type: 'error',
      status: 'failed',
      error_type: errorType,
      error_message: errorMessage,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log webhook error:', error);
  }
}
