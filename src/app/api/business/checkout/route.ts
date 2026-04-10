import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendBusinessJobAdminAlertEmail, sendBusinessJobConfirmationEmail } from '@/lib/email/sendBusinessEmail';

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BH-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore  = await cookies();
    const session      = getBizSession(cookieStore);
    if (!session?.email) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey)     return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 });

    const stripe = new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' as const });
    const body   = await request.json();

    const {
      total, routeLabel, urgencyLabel,
      route_type, delivery_mode, company_name, phone, pickup, dropoff,
      description, category, weight, value, urgency, urgency_tier,
      delivery_type, delivery_date, expected_delivery_date,
      insurance_fee, fragile, review_required,
      night_service, weekend, dedicated_driver, immediate_dispatch,
      meet_greet_origin, meet_greet_dest,
      sender_name, sender_email, receiver_company, receiver_name,
      receiver_phone, receiver_email, receiver_address, customs_handled_by,
      extra_pickup_miles, extra_drop_miles, is_priority, metadata,
    } = body;

    if (!total || total < 1) return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    if (!pickup || !dropoff) return NextResponse.json({ error: 'Pickup and drop-off required.' }, { status: 400 });

    const jobRef   = generateRef();
    const supabase = createSupabaseAdminClient();

    // ── Create job with pending_payment status ──────────────────────────────
    const coreData: Record<string, unknown> = {
      job_ref: jobRef, email: session.email,
      company_name: company_name || null, phone: phone || null,
      pickup, dropoff, description: description || null,
      weight: weight || null, declared_value: value || null,
      category: category || null,
      urgency: urgency_tier || urgency || 'planned',
      insurance: true,
      estimated_price: total,
      insurance_fee: insurance_fee || null,
      delivery_type: delivery_type || route_type || 'local_uk',
      delivery_date: delivery_date || null,
      expected_delivery_date: expected_delivery_date || null,
      status: 'pending_payment',
    };

    const extraData: Record<string, unknown> = {
      route_type: route_type || null,
      delivery_mode: delivery_mode || null,
      urgency_tier: urgency_tier || urgency || null,
      dangerous_goods: false,
      fragile: fragile ?? false,
      review_required: review_required ?? false,
      sender_name: sender_name || null,
      sender_email: sender_email || null,
      receiver_company: receiver_company || null,
      receiver_name: receiver_name || null,
      receiver_phone: receiver_phone || null,
      receiver_email: receiver_email || null,
      receiver_address: receiver_address || null,
      customs_handled_by: customs_handled_by || null,
      extra_pickup_miles: extra_pickup_miles ?? 0,
      extra_drop_miles: extra_drop_miles ?? 0,
      metadata: {
        ...(metadata || {}),
        night_service, weekend, dedicated_driver, immediate_dispatch,
        meet_greet_origin, meet_greet_dest,
        is_priority: is_priority ?? false,
      },
    };

    const { error: insertError } = await supabase.from('business_jobs').insert({ ...coreData, ...extraData });
    if (insertError) {
      // Fallback: core columns only (before DB migration)
      const { error: fb } = await supabase.from('business_jobs').insert(coreData);
      if (fb) throw fb;
    }

    // ── Stripe checkout session ─────────────────────────────────────────────
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `BootHop Business Delivery — ${jobRef}`,
            description: `${routeLabel || `${pickup} → ${dropoff}`} · ${urgencyLabel || urgency_tier || urgency || 'Delivery'}`,
          },
          unit_amount: Math.round(total * 100), // pence
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: session.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/business/portal?payment=success&jobRef=${jobRef}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/business/portal?payment=cancelled&jobRef=${jobRef}`,
      metadata: {
        job_ref:    jobRef,
        email:      session.email,
        source:     'business_portal',
        is_priority: String(is_priority ?? false),
      },
    });

    // ── Notify admin ─────────────────────────────────────────────────────────
    await Promise.allSettled([
      sendBusinessJobAdminAlertEmail({
        jobRef, email: session.email,
        companyName:   company_name  || '',
        pickup, dropoff,
        description:   description   || '',
        weight:        weight        || '',
        declaredValue: value         || '',
        category:      category      || '',
        urgency:       urgency_tier  || urgency || 'planned',
        insurance:     true,
        price:         total,
      }),
      sendBusinessJobConfirmationEmail({
        to:      session.email,
        jobRef,  pickup, dropoff,
        urgency: urgency_tier || urgency || 'planned',
        price:   total,
      }),
    ]);

    return NextResponse.json({ ok: true, checkoutUrl: stripeSession.url, jobRef });
  } catch (error) {
    console.error('business/checkout error:', error);
    return NextResponse.json({ error: 'Payment setup failed.' }, { status: 500 });
  }
}
