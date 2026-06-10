import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data: items } = await supabase
    .from('bd_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  return NextResponse.json({ items: items ?? [] });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const supabase = createSupabaseAdminClient();
  await supabase.from('bd_notifications').update({ read: true }).eq('id', id);
  return NextResponse.json({ ok: true });
}
