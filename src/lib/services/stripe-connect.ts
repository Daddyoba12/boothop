import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createConnectAccount(userId: string, email: string, country = 'GB') {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const { data: user } = await supabase.from('users').select('stripe_connect_id').eq('id', userId).single();
  if (user?.stripe_connect_id) return { accountId: user.stripe_connect_id, alreadyExists: true };

  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_type: 'individual',
    metadata: { user_id: userId },
  });

  await supabase.from('users').update({
    stripe_connect_id: account.id,
    stripe_account_type: 'express',
    stripe_verification_status: 'unverified',
    stripe_onboarding_started_at: new Date().toISOString(),
  }).eq('id', userId);

  return { accountId: account.id, alreadyExists: false };
}

export async function createOnboardingLink(userId: string, refreshUrl: string, returnUrl: string) {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const { data: user } = await supabase.from('users').select('stripe_connect_id').eq('id', userId).single();
  if (!user?.stripe_connect_id) throw new Error('No Stripe Connect account');

  const link = await stripe.accountLinks.create({
    account: user.stripe_connect_id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return link.url;
}

export async function refreshAccountStatus(userId: string) {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const { data: user } = await supabase.from('users').select('stripe_connect_id').eq('id', userId).single();
  if (!user?.stripe_connect_id) throw new Error('No Stripe Connect account');

  const account = await stripe.accounts.retrieve(user.stripe_connect_id);

  await supabase.rpc('update_user_stripe_status', { p_user_id: userId, p_stripe_account: account as any });

  return {
    chargesEnabled:    account.charges_enabled,
    payoutsEnabled:    account.payouts_enabled,
    detailsSubmitted:  account.details_submitted,
    requirements:      account.requirements,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    disabledReason:    (account as any).disabled_reason,
  };
}

export async function createAccountDashboardLink(userId: string) {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const { data: user } = await supabase.from('users').select('stripe_connect_id').eq('id', userId).single();
  if (!user?.stripe_connect_id) throw new Error('No Stripe Connect account');

  const link = await stripe.accounts.createLoginLink(user.stripe_connect_id);
  return link.url;
}

export async function savePaymentMethod(userId: string, stripePaymentMethodId: string): Promise<void> {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

  const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).single();
  if (user?.stripe_customer_id) {
    await stripe.paymentMethods.attach(stripePaymentMethodId, { customer: user.stripe_customer_id }).catch(() => {});
  }

  await supabase.from('user_payment_methods').update({ is_default: false }).eq('user_id', userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = { user_id: userId, stripe_payment_method_id: stripePaymentMethodId, type: pm.type, is_default: true, is_active: true };
  if (pm.type === 'card' && pm.card) {
    row.card_brand     = pm.card.brand;
    row.card_last4     = pm.card.last4;
    row.card_exp_month = pm.card.exp_month;
    row.card_exp_year  = pm.card.exp_year;
    row.card_country   = pm.card.country;
  }

  await supabase.from('user_payment_methods').insert(row);
}

export async function validatePaymentMethod(userId: string): Promise<{ valid: boolean; paymentMethodId?: string; error?: string }> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('user_payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (!data) return { valid: false, error: 'No payment method found. Please add a card.' };

  if (data.type === 'card') {
    const now = new Date();
    if (
      data.card_exp_year < now.getFullYear() ||
      (data.card_exp_year === now.getFullYear() && data.card_exp_month < now.getMonth() + 1)
    ) {
      return { valid: false, error: 'Your card has expired. Please add a new one.' };
    }
  }

  return { valid: true, paymentMethodId: data.stripe_payment_method_id };
}

export async function createIdentityVerification(userId: string) {
  const supabase = getSupabase();
  const stripe   = getStripe();

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { user_id: userId },
  });

  await supabase.from('stripe_verification_attempts').insert({
    user_id: userId,
    attempt_type: 'identity',
    status: 'pending',
    stripe_verification_session_id: session.id,
  });

  return { sessionId: session.id, clientSecret: session.client_secret, url: session.url };
}
