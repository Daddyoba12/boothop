import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('otb_pipeline_state')
    .select('posts_today, current_step, pending_slots_json')
    .eq('company_slug', session.slug)
    .eq('slot', 0)
    .single();

  let pending_slots: number[] = [];
  try { pending_slots = JSON.parse(data?.pending_slots_json || '[]'); } catch { /* ignore */ }

  return NextResponse.json({
    posts_today:   data?.posts_today   ?? 0,
    current_step:  data?.current_step  ?? '',
    pending_slots,
    cloud_mode: false,
  });
}
