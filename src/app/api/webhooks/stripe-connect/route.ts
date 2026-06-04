import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STRIPE CONNECT WEBHOOK
// Handles events on connected accounts (traveller verification & payouts)
// Register this URL in Stripe Dashboard → Webhooks → "+ Add endpoint"
// URL: https://www.boothop.com/api/webhooks/stripe-connect
// Events: account.updated, capability.updated, payout.created, payout.failed
// ============================================================================

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' as any });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const stripe    = getStripe();

  try {
    const body       = await request.text();
    const headersList = await headers();
    const signature  = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_CONNECT_WEBHOOK_SECRET not set');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Connect webhook signature failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`\n🔗 Connect Webhook: ${event.type} | Account: ${event.account || 'platform'}`);

    const supabase = getSupabase();
    let result: any;

    switch (event.type) {
      case 'account.updated':
        result = await handleAccountUpdated(event.data.object as Stripe.Account, supabase);
        break;

      case 'capability.updated':
        result = await handleCapabilityUpdated(event.data.object as Stripe.Capability, event.account, supabase);
        break;

      case 'payout.created':
        result = await handlePayoutCreated(event.data.object as Stripe.Payout, event.account, supabase);
        break;

      case 'payout.failed':
        result = await handlePayoutFailed(event.data.object as Stripe.Payout, event.account, supabase);
        break;

      default:
        result = { handled: false };
    }

    // Log to stripe_webhook_logs
    supabase.from('stripe_webhook_logs').insert({
      stripe_event_id:    event.id,
      event_type:         event.type,
      account_id:         event.account || null,
      http_status:        200,
      processing_time_ms: Date.now() - startTime,
      payload:            event as any,
      response:           result,
    }).then(() => {});

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Connect webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleAccountUpdated(account: Stripe.Account, supabase: ReturnType<typeof getSupabase>) {
  console.log(`🔄 account.updated: ${account.id} | charges=${account.charges_enabled} payouts=${account.payouts_enabled}`);

  // Find user by stripe_connect_id
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_connect_id', account.id)
    .single();

  if (!user) {
    console.warn(`⚠️  No user found for Connect account ${account.id}`);
    return { handled: false, reason: 'user_not_found' };
  }

  // Update verification status via DB function
  await supabase.rpc('update_user_stripe_status', {
    p_user_id: user.id,
    p_stripe_account: account as any,
  });

  const fullyVerified = account.charges_enabled && account.payouts_enabled && account.details_submitted;

  if (fullyVerified) {
    console.log(`✅ Traveller ${user.email} fully verified — payouts enabled`);

    // Send confirmation email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: 'BootHop <noreply@boothop.com>',
      to: user.email,
      subject: '✅ Your BootHop traveller account is verified',
      html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
        <h2 style="color:#10b981;">You're verified!</h2>
        <p style="color:#94a3b8;">Your identity has been confirmed by Stripe. You can now accept deliveries and receive payouts directly to your bank account.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Go to Dashboard</a>
      </div>`,
    }).catch(() => {});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const disabledReason = (account as any).disabled_reason;
  if (disabledReason) {
    console.warn(`⚠️  Account ${account.id} disabled: ${disabledReason}`);
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: 'BootHop <noreply@boothop.com>',
      to: user.email,
      subject: '⚠️ Action required — BootHop account needs attention',
      html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
        <h2 style="color:#f59e0b;">Account needs attention</h2>
        <p style="color:#94a3b8;">Your Stripe account requires additional information before you can receive payouts. Please complete the verification steps.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/traveller/onboarding" style="background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Complete Verification</a>
      </div>`,
    }).catch(() => {});
  }

  return {
    handled:      true,
    userId:       user.id,
    verified:     fullyVerified,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
}

async function handleCapabilityUpdated(
  capability: Stripe.Capability,
  accountId: string | undefined,
  supabase: ReturnType<typeof getSupabase>
) {
  console.log(`🔄 capability.updated: ${capability.id} | status=${capability.status} | account=${accountId}`);

  if (!accountId) return { handled: false };

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_connect_id', accountId)
    .single();

  if (!user) return { handled: false };

  if (capability.status === 'active') {
    // Re-sync full account state
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    await supabase.rpc('update_user_stripe_status', {
      p_user_id: user.id,
      p_stripe_account: account as any,
    });
  }

  return { handled: true, userId: user.id, capability: capability.id, status: capability.status };
}

async function handlePayoutCreated(
  payout: Stripe.Payout,
  accountId: string | undefined,
  supabase: ReturnType<typeof getSupabase>
) {
  console.log(`💸 payout.created: £${payout.amount / 100} | account=${accountId}`);
  if (!accountId) return { handled: false };

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_connect_id', accountId)
    .single();

  if (!user) return { handled: false };

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: 'BootHop <noreply@boothop.com>',
    to: user.email,
    subject: `💸 Payout of £${(payout.amount / 100).toFixed(2)} is on its way`,
    html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
      <h2 style="color:#10b981;">Payout initiated</h2>
      <p style="color:#94a3b8;">£${(payout.amount / 100).toFixed(2)} is being transferred to your bank account. It typically arrives within 2-5 business days.</p>
    </div>`,
  }).catch(() => {});

  return { handled: true, userId: user.id, amount: payout.amount / 100 };
}

async function handlePayoutFailed(
  payout: Stripe.Payout,
  accountId: string | undefined,
  supabase: ReturnType<typeof getSupabase>
) {
  console.error(`❌ payout.failed: £${payout.amount / 100} | reason=${payout.failure_message} | account=${accountId}`);
  if (!accountId) return { handled: false };

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_connect_id', accountId)
    .single();

  if (!user) return { handled: false };

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: 'BootHop <noreply@boothop.com>',
    to: user.email,
    subject: '⚠️ Payout failed — action required',
    html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
      <h2 style="color:#ef4444;">Payout failed</h2>
      <p style="color:#94a3b8;">Your payout of £${(payout.amount / 100).toFixed(2)} failed: <em>${payout.failure_message || 'Unknown reason'}</em></p>
      <p style="color:#94a3b8;">Please update your bank details in your dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/traveller/onboarding" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Update Bank Details</a>
    </div>`,
  }).catch(() => {});

  return { handled: true, userId: user.id, amount: payout.amount / 100, reason: payout.failure_message };
}
