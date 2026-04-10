import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  sendBusinessJobConfirmationEmail,
  sendBusinessJobAdminAlertEmail,
} from '@/lib/email/sendBusinessEmail';

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BH-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);

    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Core (existing columns)
      company_name, phone, pickup, dropoff, description,
      category, weight, value, urgency, delivery_type,
      delivery_date, expected_delivery_date,
      insurance, price, insurance_fee,
      // New fields
      route_type, delivery_mode, urgency_tier,
      dangerous_goods, fragile, review_required,
      night_service, weekend, dedicated_driver, immediate_dispatch,
      meet_greet_origin, meet_greet_dest,
      sender_name, sender_email,
      receiver_company, receiver_name, receiver_phone, receiver_email, receiver_address,
      customs_handled_by, is_priority,
      extra_pickup_miles, extra_drop_miles,
      metadata,
    } = body;

    if (!pickup || !dropoff) {
      return NextResponse.json({ error: 'Pickup and drop-off are required.' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const jobRef   = generateRef();
    const supabase = createSupabaseAdminClient();

    // Determine status: goes to 'review' if manual assessment needed, else 'pending'
    const jobStatus = (review_required || dangerous_goods) ? 'review' : 'pending';

    const insertData: Record<string, unknown> = {
      job_ref:                jobRef,
      email:                  session.email,
      company_name:           company_name           || null,
      phone:                  phone                  || null,
      pickup,
      dropoff,
      description:            description            || null,
      weight:                 weight                 || null,
      declared_value:         value                  || null,
      category:               category               || null,
      urgency:                urgency_tier || urgency || 'planned',
      insurance:              insurance !== false,
      estimated_price:        price                  || null,
      insurance_fee:          insurance_fee          || null,
      delivery_type:          delivery_type          || route_type || 'local_uk',
      delivery_date:          delivery_date          || null,
      expected_delivery_date: expected_delivery_date || null,
      status:                 jobStatus,
    };

    // Add new columns if they exist (graceful — won't error if column missing)
    const extras: Record<string, unknown> = {
      route_type:          route_type          || null,
      delivery_mode:       delivery_mode       || null,
      urgency_tier:        urgency_tier        || urgency || null,
      dangerous_goods:     dangerous_goods     ?? false,
      fragile:             fragile             ?? false,
      review_required:     review_required     ?? false,
      sender_name:         sender_name         || null,
      sender_email:        sender_email        || null,
      receiver_company:    receiver_company    || null,
      receiver_name:       receiver_name       || null,
      receiver_phone:      receiver_phone      || null,
      receiver_email:      receiver_email      || null,
      receiver_address:    receiver_address    || null,
      customs_handled_by:  customs_handled_by  || null,
      extra_pickup_miles:  extra_pickup_miles  ?? 0,
      extra_drop_miles:    extra_drop_miles    ?? 0,
      metadata: {
        ...(metadata || {}),
        night_service, weekend, dedicated_driver, immediate_dispatch,
        meet_greet_origin, meet_greet_dest,
        is_priority: is_priority ?? false,
      },
    };

    // Attempt insert with extra columns; fall back to core only if schema error
    const { error: insertError } = await supabase.from('business_jobs').insert({ ...insertData, ...extras });

    if (insertError) {
      // If new columns don't exist yet, insert core data only
      if (insertError.code === 'PGRST204' || insertError.message?.includes('column')) {
        const { error: fallbackError } = await supabase.from('business_jobs').insert(insertData);
        if (fallbackError) throw fallbackError;
      } else {
        throw insertError;
      }
    }

    await Promise.allSettled([
      sendBusinessJobAdminAlertEmail({
        jobRef,
        email:         session.email,
        companyName:   company_name  || '',
        pickup,
        dropoff,
        description:   description  || '',
        weight:        weight        || '',
        declaredValue: value         || '',
        category:      category      || '',
        urgency:       urgency_tier || urgency || 'planned',
        insurance:     insurance !== false,
        price:         price         || 0,
      }),
      sendBusinessJobConfirmationEmail({
        to:      session.email,
        jobRef,
        pickup,
        dropoff,
        urgency: urgency_tier || urgency || 'planned',
        price:   price        || 0,
      }),
    ]);

    return NextResponse.json({ ok: true, jobRef, status: jobStatus });
  } catch (error) {
    console.error('business/create-job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
