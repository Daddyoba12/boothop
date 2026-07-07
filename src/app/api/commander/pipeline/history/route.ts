import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const pipelineBase = process.env.PIPELINE_BASE_URL;
  const secret       = process.env.PIPELINE_SECRET ?? '';

  // Try the Oracle pipeline post-log first
  if (pipelineBase) {
    try {
      const r = await fetch(`${pipelineBase}/api/post-log?days=14`, {
        headers: { 'x-pipeline-secret': secret, 'x-commander-slug': session.slug },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
      }
    } catch { /* fall through */ }
  }

  // Fallback: return rendered slot state from Supabase as "history"
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('otb_pipeline_state')
    .select('slot, hook, v1_url, v2_url, rendered_at, caption_tiktok')
    .eq('company_slug', session.slug)
    .gte('slot', 1)
    .not('rendered_at', 'is', null)
    .order('rendered_at', { ascending: false })
    .limit(20);

  const rows = (data ?? []).map(row => ({
    date:      (row.rendered_at ?? '').slice(0, 10),
    platform:  'pipeline',
    slot:      row.slot,
    hook:      row.hook ?? '',
    video_url: row.v1_url ?? '',
    posted_at: row.rendered_at ?? '',
  }));

  return NextResponse.json(rows);
}
