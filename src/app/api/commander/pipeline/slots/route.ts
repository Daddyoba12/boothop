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
    .select('slot, hook, problem, stakes, resolution, lesson, caption_tiktok, caption_instagram, v1_url, v2_url, pending_approval, rendered_at')
    .eq('company_slug', session.slug)
    .in('slot', [1, 2, 3, 4]);

  const result: Record<string, object> = {};
  for (const row of data ?? []) {
    result[String(row.slot)] = {
      hook:              row.hook              || '',
      problem:           row.problem           || '',
      stakes:            row.stakes            || '',
      resolution:        row.resolution        || '',
      lesson:            row.lesson            || '',
      caption_tiktok:    row.caption_tiktok    || '',
      caption_instagram: row.caption_instagram || '',
      v1:                row.v1_url            || '',
      v2:                row.v2_url            || '',
      pending_approval:  row.pending_approval  ?? false,
      rendered_at:       row.rendered_at       || '',
    };
  }
  return NextResponse.json(result);
}
