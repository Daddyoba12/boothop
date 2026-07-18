import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from('push_subscriptions').upsert(
    {
      user_email:   session.email,
      subscription: { type: 'expo', token },
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'user_email' }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  await supabase.from('push_subscriptions').delete().eq('user_email', session.email);

  return NextResponse.json({ ok: true });
}
