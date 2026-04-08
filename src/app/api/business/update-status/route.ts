import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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
  if (status === 'in_transit') update.picked_up_at  = new Date().toISOString();
  if (status === 'delivered')  update.delivered_at  = new Date().toISOString();

  await supabase.from('business_jobs').update(update).eq('id', id);

  return NextResponse.json({ ok: true });
}
