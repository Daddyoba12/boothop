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
  if (!slot) return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });

  const db = createSupabaseAdminClient();
  await db.from('otb_pipeline_commands').insert({
    slot,
    command:      'regen',
    company_slug: session.slug,
    status:       'pending',
  });

  return NextResponse.json({ ok: true });
}
