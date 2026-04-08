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
      company_name, phone, pickup, dropoff, description, weight,
      value, category, urgency, price, miles,
      insurance_fee, delivery_type, delivery_date, expected_delivery_date,
    } = body;

    if (!pickup || !dropoff) {
      return NextResponse.json({ error: 'Pickup and drop-off are required.' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const jobRef   = generateRef();
    const supabase = createSupabaseAdminClient();

    await supabase.from('business_jobs').insert({
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
      urgency:                urgency                || 'same_day',
      insurance:              true,
      estimated_price:        price                  || null,
      distance_miles:         miles                  || null,
      insurance_fee:          insurance_fee          || null,
      delivery_type:          delivery_type          || 'local_uk',
      delivery_date:          delivery_date          || null,
      expected_delivery_date: expected_delivery_date || null,
      status:                 'pending',
    });

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
        urgency:       urgency       || 'same_day',
        insurance:     true,
        price:         price         || 0,
      }),
      sendBusinessJobConfirmationEmail({
        to:      session.email,
        jobRef,
        pickup,
        dropoff,
        urgency: urgency || 'same_day',
        price:   price   || 0,
      }),
    ]);

    return NextResponse.json({ ok: true, jobRef });
  } catch (error) {
    console.error('business/create-job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
