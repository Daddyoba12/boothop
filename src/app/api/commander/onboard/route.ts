import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getSession() {
  const store = await cookies();
  return getCommanderSession(store);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('company_profiles')
    .select('*')
    .eq('company_id', session.clientId)
    .single();

  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json();
  const {
    business_name, contact_name, email, phone, website, bio,
    platforms_json, tg_chat_id, whatsapp,
    custom_1_label, custom_1_value,
    custom_2_label, custom_2_value,
    custom_3_label, custom_3_value,
    custom_4_label, custom_4_value,
  } = body;

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('company_profiles')
    .upsert({
      company_id:     session.clientId,
      business_name:  business_name  ?? '',
      contact_name:   contact_name   ?? '',
      email:          email          ?? '',
      phone:          phone          ?? '',
      website:        website        ?? '',
      bio:            bio            ?? '',
      platforms_json: platforms_json ?? '[]',
      tg_chat_id:     tg_chat_id     ?? '',
      whatsapp:       whatsapp       ?? '',
      custom_1_label: custom_1_label ?? '', custom_1_value: custom_1_value ?? '',
      custom_2_label: custom_2_label ?? '', custom_2_value: custom_2_value ?? '',
      custom_3_label: custom_3_label ?? '', custom_3_value: custom_3_value ?? '',
      custom_4_label: custom_4_label ?? '', custom_4_value: custom_4_value ?? '',
      onboarded_at:   new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'company_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
