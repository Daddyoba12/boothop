import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const PIPELINE_SECRET = process.env.PIPELINE_SECRET ?? 'boothop_pipeline_secret_2026';

// GET — pipeline polls this to get the latest unprocessed decision
export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-pipeline-secret');
  if (auth !== PIPELINE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('pipeline_decisions')
    .select('*')
    .eq('processed', false)
    .not('decision', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ decision: null });
  }

  // Mark as processed immediately so it's not returned twice
  await supabase
    .from('pipeline_decisions')
    .update({ processed: true })
    .eq('id', data.id);

  return NextResponse.json({ decision: data.decision, id: data.id });
}
