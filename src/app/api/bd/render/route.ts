import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contentId } = await request.json();
  if (!contentId) return NextResponse.json({ error: 'contentId required' }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // Check content exists
  const { data: content, error: ce } = await supabase.from('bd_content').select('id, status').eq('id', contentId).single();
  if (ce || !content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

  // Create a render job
  const { data: job, error: je } = await supabase
    .from('bd_render_jobs')
    .insert({ content_id: contentId, status: 'pending' })
    .select()
    .single();

  if (je) return NextResponse.json({ error: je.message }, { status: 500 });

  // Update content status to queued
  await supabase.from('bd_content').update({ status: 'queued' }).eq('id', contentId);

  await supabase.from('bd_notifications').insert({
    message: `Render queued for content ${contentId.slice(0, 8)}... — Python script will process it`,
    type: 'info',
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}
