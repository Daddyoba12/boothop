import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAILS = [
  'daddyoba12@gmail.com',
  ...(process.env.ADMIN_EMAILS ?? 'info@boothop.com').split(',').map(e => e.trim()).filter(Boolean),
];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);

  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
