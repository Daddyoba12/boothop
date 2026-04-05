import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyAppSession, getSessionCookieName } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    // ── Verify admin session ─────────────────────────────────────────────────
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieName   = getSessionCookieName();
    const match0       = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${cookieName}=`));
    const token   = match0 ? decodeURIComponent(match0.split('=').slice(1).join('=')) : null;
    const session = token ? (() => { try { return verifyAppSession(token); } catch { return null; } })() : null;

    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Confirm the caller is an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.email)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body       = await request.json();
    const { matchId, email, decision } = body as {
      matchId: string;
      email: string;
      decision: 'approved' | 'rejected';
    };

    if (!matchId || !email || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'matchId, email and decision are required.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ── Update video_kyc table ───────────────────────────────────────────────
    await supabase
      .from('video_kyc')
      .update({ status: decision, reviewed_at: now, reviewed_by: session.email })
      .eq('match_id', matchId)
      .eq('email', email);

    // ── Update matches table for the relevant side ───────────────────────────
    const { data: match } = await supabase
      .from('matches')
      .select('booter_email, hooper_email')
      .eq('id', matchId)
      .maybeSingle();

    if (match) {
      const isBooter = match.booter_email === email;
      const matchUpdate = isBooter
        ? { booter_video_kyc_status: decision }
        : { hooper_video_kyc_status: decision };

      // If approved, also flag id_received for that side
      if (decision === 'approved') {
        Object.assign(matchUpdate, isBooter
          ? { booter_id_received: true }
          : { hooper_id_received: true }
        );
      }

      await supabase.from('matches').update(matchUpdate).eq('id', matchId);
    }

    // ── If approved, mark profile as id_verified ─────────────────────────────
    if (decision === 'approved') {
      await supabase
        .from('profiles')
        .update({ id_verified: true, id_verified_at: now })
        .eq('email', email);
    }

    return NextResponse.json({ ok: true, decision });

  } catch (err) {
    console.error('video-approve error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
