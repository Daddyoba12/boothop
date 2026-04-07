import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const VALID_STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id, status } = await request.json();
  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from('business_jobs').update({ status }).eq('id', id);

  return NextResponse.json({ ok: true });
}
