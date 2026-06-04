import { NextRequest, NextResponse } from 'next/server';
import { refreshAccountStatus } from '@/lib/services/stripe-connect';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseAdminClient();
    const { data: user } = await supabase.from('users').select('id').eq('email', session.email).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const status = await refreshAccountStatus(user.id);
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('refresh-account-status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
