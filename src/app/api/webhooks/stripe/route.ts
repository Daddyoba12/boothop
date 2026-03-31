import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentConfirmationEmail } from '@/lib/email';

// ============================================================================
// ELITE STRIPE WEBHOOK HANDLER
// ============================================================================
// Enterprise-grade payment processing with comprehensive error handling,
// audit logging, and automated notifications
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.text();
    
     const headersList = await headers();
const signature = headersList.get('stripe-signature');
    

    if (!signature) {
      console.error('❌ Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' }, 
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      await logWebhookError('signature_verification_failed', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' }, 
        { status: 400 }
      );
    }

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

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
        result = { handled: false, message: 'Event type not handled' };
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Webhook processed successfully in ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);

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
 * Handle successful checkout session completion
 * This occurs when a customer completes payment
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout completion...');
  
  const matchId = session.metadata?.match_id;
  const customerEmail = session.customer_details?.email;

  if (!matchId) {
    console.error('❌ No match_id in session metadata');
    throw new Error('Missing match_id in session metadata');
  }

  try {
    // Update match with payment details
    const { data: match, error: updateError } = await supabase
      .from('matches')
      .update({
        payment_status: 'escrowed',
        payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
        status: 'accepted',
        payment_escrowed_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw updateError;
    }

    console.log(`✅ Payment escrowed for match ${matchId}`);
    console.log(`💰 Amount: ${session.amount_total! / 100} ${session.currency?.toUpperCase()}`);

    // Send confirmation emails
    await sendPaymentConfirmationEmails(matchId, customerEmail);

    // Create notification for both parties
    await createMatchNotifications(matchId, 'payment_escrowed');

    return {
      success: true,
      matchId,
      amount: session.amount_total! / 100,
      currency: session.currency
    };

  } catch (error: any) {
    console.error('❌ Error in handleCheckoutCompleted:', error);
    throw error;
  }
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

    // Update match to completed
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        payment_status: 'released',
        payment_released_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', match.id);

    if (updateError) {
      console.error('❌ Failed to update match:', updateError);
      throw updateError;
    }

    console.log(`✅ Escrow released for match ${match.id}`);
    console.log(`💵 Traveler receives: £${match.booter_receives}`);

    // Send completion emails
    await sendDeliveryCompletionEmails(match.id);

    // Create completion notifications
    await createMatchNotifications(match.id, 'delivery_completed');

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
      amount:       `£${match.booter_receives || 0}`,
      role:         'traveler',
      from:         match.traveler_trip?.from_city,
      to_location:  match.traveler_trip?.to_city,
      transactionId: matchId,
      date,
    }),
  ]);
}

async function sendPaymentFailureNotification(matchId: string) {
  console.log(`📧 Sending payment failure notification for match ${matchId}`);
  // TODO: Implement email notification
}

async function sendDeliveryCompletionEmails(matchId: string) {
  console.log(`📧 Sending delivery completion emails for match ${matchId}`);
  // TODO: Implement email notification
}

async function sendRefundNotifications(matchId: string) {
  console.log(`📧 Sending refund notifications for match ${matchId}`);
  // TODO: Implement email notification
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
