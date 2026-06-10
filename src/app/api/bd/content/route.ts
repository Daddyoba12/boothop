import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const pillar   = searchParams.get('pillar');
  const limit    = Number(searchParams.get('limit') ?? '50');

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('bd_content')
    .select('*, bd_variants(*), bd_render_jobs(status, error, created_at)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') query = query.eq('status', status);
  if (pillar && pillar !== 'all') query = query.eq('pillar', pillar);

  const { data: items, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: items ?? [] });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const allowed = ['status', 'scheduled_at', 'hook', 'caption', 'hashtags', 'script', 'visual_desc'];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in data) patch[k] = data[k];

  const supabase = createSupabaseAdminClient();
  const { data: item, error } = await supabase.from('bd_content').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const supabase = createSupabaseAdminClient();
  await supabase.from('bd_content').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
