/**
 * /api/admin/verification-providers
 *
 * GET  — list providers (with optional filters: country, provider_type, active)
 * POST — create a new provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const country       = searchParams.get('country');
  const providerType  = searchParams.get('provider_type');
  const activeParam   = searchParams.get('active');

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('verification_providers')
    .select('*')
    .order('name', { ascending: true });

  if (country)      query = query.eq('country', country);
  if (providerType) query = query.eq('provider_type', providerType);
  if (activeParam !== null) query = query.eq('active', activeParam === 'true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ providers: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, provider_type, country } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 422 });
  }
  if (!provider_type || typeof provider_type !== 'string') {
    return NextResponse.json({ error: 'provider_type is required' }, { status: 422 });
  }
  if (!country || typeof country !== 'string') {
    return NextResponse.json({ error: 'country is required' }, { status: 422 });
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
  if (!VALID_TYPES.includes(provider_type as string)) {
    return NextResponse.json({ error: `provider_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('verification_providers')
    .insert({
      name:               name.trim(),
      provider_type,
      country:            (country as string).trim(),
      city:               body.city               ?? null,
      address:            body.address             ?? null,
      email:              body.email               ?? null,
      phone:              body.phone               ?? null,
      supported_services: body.supported_services  ?? [],
      active:             body.active !== false,
      instructions:       body.instructions        ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ provider: data }, { status: 201 });
}
