import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('matches')
    .update({
      payment_status: 'released',
      payment_released_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', matchId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
