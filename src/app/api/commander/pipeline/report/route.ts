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
  const ago = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // Try post_history table (from commander schema)
  const { data } = await db
    .from('post_history')
    .select('platform, slot')
    .eq('company_id', session.clientId)
    .gte('posted_at', ago);

  if (!data || data.length === 0) {
    return NextResponse.json({ week_total: 0, newsflash_week: 0, by_platform: {} });
  }

  const by_platform: Record<string, number> = {};
  for (const row of data) {
    const p = row.platform || 'unknown';
    by_platform[p] = (by_platform[p] || 0) + 1;
  }

  return NextResponse.json({
    week_total:      data.length,
    newsflash_week:  0,
    by_platform,
  });
}
