/**
 * /api/admin/verification-providers/[id]
 *
 * GET   — fetch single provider
 * PATCH — update provider fields (partial update; use active=false to soft-delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('verification_providers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

  return NextResponse.json({ provider: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const VALID_TYPES = [
    'approved_inspection_partner',
    'regulated_courier_facility',
    'customs_broker',
    'cargo_screening_facility',
    'authorised_security_screening_provider',
    'airline_or_airport_cargo_facility',
    'other_legally_authorised_provider',
  ];
  if (body.provider_type && !VALID_TYPES.includes(body.provider_type as string)) {
    return NextResponse.json({ error: `provider_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 422 });
  }

  const allowed = ['name','provider_type','country','city','address','email','phone','supported_services','active','instructions'] as const;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from('verification_providers')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('verification_providers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ provider: data });
}
