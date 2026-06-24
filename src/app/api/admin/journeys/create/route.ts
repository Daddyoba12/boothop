import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL = 'titobalo12@gmail.com';

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { from_city, to_city, travel_date, weight, price, type = 'travel' } = body;

  if (!from_city || !to_city || !travel_date) {
    return NextResponse.json(
      { error: 'from_city, to_city, and travel_date are required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('trips')
    .insert({
      email: ADMIN_EMAIL,
      from_city,
      to_city,
      travel_date,
      weight: weight ? Number(weight) : null,
      price: price ? Number(price) : null,
      type,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, trip: data });
}
