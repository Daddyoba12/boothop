import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET  /api/admin/carriers?status=pending
// PATCH /api/admin/carriers  { id, status }

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  const status   = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('carrier_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carriers: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, registration_fee_paid } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (registration_fee_paid !== undefined) updates.registration_fee_paid = registration_fee_paid;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('carrier_profiles')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
