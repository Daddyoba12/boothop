import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const fd   = await req.formData();
  const slot = parseInt(String(fd.get('slot') || '0'));
  const decision = String(fd.get('decision') || '');

  if (!slot || !['post', 'skip', 'regen'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  await Promise.all([
    db.from('otb_pipeline_commands').insert({
      slot,
      command:      decision,
      company_slug: session.slug,
      status:       'pending',
    }),
    db.from('otb_pipeline_state')
      .update({ pending_approval: false })
      .eq('company_slug', session.slug)
      .eq('slot', slot),
  ]);

  return NextResponse.json({ ok: true });
}
