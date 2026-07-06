import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const fd       = await req.formData();
  const media_id = parseInt(String(fd.get('media_id') || '0'));
  if (!media_id) return NextResponse.json({ error: 'Invalid media_id' }, { status: 400 });

  const db = createSupabaseAdminClient();
  await db.from('otb_pipeline_commands').insert({
    slot:         0,
    command:      'block_media',
    company_slug: session.slug,
    edit_fields:  { media_id },
    status:       'pending',
  });

  return NextResponse.json({ ok: true });
}
