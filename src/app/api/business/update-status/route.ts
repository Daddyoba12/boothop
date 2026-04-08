import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  sendBusinessDriverAssignedEmail,
  sendBusinessInTransitEmail,
  sendBusinessDeliveredEmail,
  sendBusinessFailedEmail,
} from '@/lib/email/sendBusinessEmail';

const VALID_STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled', 'failed'];

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id, status, driverName, driverEmail, driverPhone } = await request.json();
  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const update: Record<string, unknown> = { status };
  if (status === 'assigned') {
    if (driverName)  update.driver_name  = driverName;
    if (driverEmail) update.driver_email = driverEmail;
    if (driverPhone) update.driver_phone = driverPhone;
    update.assigned_at = new Date().toISOString();
  }
  if (status === 'in_transit') update.picked_up_at = new Date().toISOString();
  if (status === 'delivered')  update.delivered_at = new Date().toISOString();

  await supabase.from('business_jobs').update(update).eq('id', id);

  // Fetch job to send status email to business user
  const { data: job } = await supabase
    .from('business_jobs')
    .select('email, pickup, dropoff, job_ref, driver_name, driver_email, driver_phone, estimated_price')
    .eq('id', id)
    .single();

  if (job?.email) {
    await Promise.allSettled([
      status === 'assigned' && sendBusinessDriverAssignedEmail({
        to:          job.email,
        jobRef:      job.job_ref,
        pickup:      job.pickup,
        dropoff:     job.dropoff,
        driverName:  driverName  || job.driver_name  || 'Your carrier',
        driverPhone: driverPhone || job.driver_phone,
        driverEmail: driverEmail || job.driver_email,
      }),
      status === 'in_transit' && sendBusinessInTransitEmail({
        to:      job.email,
        jobRef:  job.job_ref,
        pickup:  job.pickup,
        dropoff: job.dropoff,
      }),
      status === 'delivered' && sendBusinessDeliveredEmail({
        to:      job.email,
        jobRef:  job.job_ref,
        pickup:  job.pickup,
        dropoff: job.dropoff,
        price:   job.estimated_price ?? 0,
      }),
      status === 'failed' && sendBusinessFailedEmail({
        to:      job.email,
        jobRef:  job.job_ref,
        pickup:  job.pickup,
        dropoff: job.dropoff,
      }),
    ].filter(Boolean));
  }

  return NextResponse.json({ ok: true });
}
