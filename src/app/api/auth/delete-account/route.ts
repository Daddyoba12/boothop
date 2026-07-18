import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAppSession, getSessionCookieName } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const email = session.email;
    const supabase = createSupabaseAdminClient();

    // Resolve profile id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profile?.id) {
      const uid = profile.id;
      // Delete user data — order matters to avoid FK violations
      await supabase.from('delivery_matches').delete().or(`hooper_id.eq.${uid},booter_id.eq.${uid}`);
      await supabase.from('delivery_requests').delete().eq('hooper_id', uid);
      await supabase.from('ratings').delete().or(`reviewer_id.eq.${uid},reviewee_id.eq.${uid}`);
      await supabase.from('profiles').delete().eq('id', uid);

      // Remove from Supabase Auth if present
      try {
        const { data: authUsers } = await (supabase.auth.admin as any).listUsers({ perPage: 1000 });
        const authUser = (authUsers?.users ?? []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (authUser) {
          await (supabase.auth.admin as any).deleteUser(authUser.id);
        }
      } catch { /* non-blocking */ }
    }

    // Delete login codes and credits
    await supabase.from('email_login_codes').delete().eq('email', email);
    try { await supabase.from('signup_credits').delete().eq('email', email); } catch { /* table optional */ }

    // Clear session cookie
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(), '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (err) {
    console.error('delete-account error', err);
    return NextResponse.json({ error: 'Account deletion failed.' }, { status: 500 });
  }
}
