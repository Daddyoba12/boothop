import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db  = createSupabaseAdminClient();
  const ago = new Date(Date.now() - 14 * 86_400_000).toISOString().split('T')[0];

  const { data } = await db
    .from('post_history')
    .select('id, date, slot, platform, hook, media_id, posted_at')
    .eq('company_id', session.clientId)
    .gte('date', ago)
    .order('posted_at', { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}
