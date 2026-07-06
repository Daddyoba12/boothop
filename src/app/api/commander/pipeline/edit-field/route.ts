import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_FIELDS = new Set([
  'hook', 'problem', 'stakes', 'resolution', 'lesson',
  'caption_tiktok', 'caption_instagram',
]);

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const fd    = await req.formData();
  const slot  = parseInt(String(fd.get('slot') || '0'));
  const field = String(fd.get('field') || '');
  const value = String(fd.get('value') || '');

  if (!slot || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('otb_pipeline_state')
    .update({ [field]: value })
    .eq('company_slug', session.slug)
    .eq('slot', slot);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
