import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getSession() {
  const store = await cookies();
  return getCommanderSession(store);
}

async function resolveClientId(session: Awaited<ReturnType<typeof getSession>>, req: NextRequest): Promise<string> {
  if (!session) return '';
  const forClient = new URL(req.url).searchParams.get('forClient')?.trim().toLowerCase() || '';
  if (session.isSuper && forClient && forClient !== session.slug) {
    const db = createSupabaseAdminClient();
    const { data } = await db
      .from('pipeline_clients')
      .select('id')
      .eq('slug', forClient)
      .single();
    if (data?.id) return data.id;
  }
  return session.clientId;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const clientId = await resolveClientId(session, req);
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('company_profiles')
    .select('*')
    .eq('company_id', clientId)
    .single();

  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json();
  const clientId = await resolveClientId(session, req);

  const {
    business_name, contact_name, email, phone, website, bio,
    platforms_json, tg_chat_id, whatsapp,
    custom_1_label, custom_1_value,
    custom_2_label, custom_2_value,
    custom_3_label, custom_3_value,
    custom_4_label, custom_4_value,
  } = body;

  // forClient may also be in the body (from FormData path)
  const bodyForClient = (body.forClient || '').trim().toLowerCase();
  const effectiveClientId = (session.isSuper && bodyForClient && bodyForClient !== session.slug)
    ? await (async () => {
        const db = createSupabaseAdminClient();
        const { data } = await db.from('pipeline_clients').select('id').eq('slug', bodyForClient).single();
        return data?.id ?? clientId;
      })()
    : clientId;

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('company_profiles')
    .upsert({
      company_id:     effectiveClientId,
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
