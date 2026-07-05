import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// All fields admin can edit — id, user_id, created_at are never touched
const NUMERIC_FIELDS  = new Set(['price', 'weight', 'weight_capacity', 'asking_price', 'lat', 'lng']);
const ALLOWED_FIELDS  = new Set([
  'status', 'travel_date', 'price', 'weight', 'weight_capacity', 'asking_price',
  'from_city', 'to_city', 'from_city_en', 'to_city_en',
  'type', 'email', 'description', 'notes', 'package_size',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Support bulk edit: { fields: { field: value, ... }, reason } OR legacy single { field, value, reason }
  let updates: Record<string, unknown> = {};
  const reason: string = body.reason ?? '';

  if (body.fields && typeof body.fields === 'object') {
    updates = body.fields;
  } else if (body.field) {
    updates = { [body.field]: body.value };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (!reason.trim() || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
  }

  // Validate all fields
  for (const field of Object.keys(updates)) {
    if (!ALLOWED_FIELDS.has(field)) {
      return NextResponse.json({ error: `Field not editable: ${field}` }, { status: 400 });
    }
    if (NUMERIC_FIELDS.has(field) && updates[field] !== '' && updates[field] !== null) {
      updates[field] = Number(updates[field]);
    }
    if (updates[field] === '') updates[field] = null;
  }

  updates.updated_at = new Date().toISOString();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('trips').update(updates).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: Object.keys(updates), reason });
}
