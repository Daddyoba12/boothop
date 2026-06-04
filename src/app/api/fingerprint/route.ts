import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { fingerprint, components } = await request.json();
    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    const email       = session?.email?.toLowerCase().trim() ?? null;

    const ip       = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua       = request.headers.get('user-agent') ?? null;
    const supabase = createSupabaseAdminClient();

    // Upsert — one row per (fingerprint, email) pair, update last_seen on repeat visits
    await supabase.from('device_fingerprints').upsert(
      {
        fingerprint,
        email,
        ip_address: ip,
        user_agent: ua,
        components,
        last_seen:  new Date().toISOString(),
      },
      { onConflict: 'fingerprint,email', ignoreDuplicates: false }
    );

    // Check if this fingerprint is banned
    const { data: fpRow } = await supabase
      .from('device_fingerprints')
      .select('is_banned, ban_reason')
      .eq('fingerprint', fingerprint)
      .eq('is_banned', true)
      .maybeSingle();

    // Check if this fingerprint is shared with a banned account (cross-account detection)
    const { count: bannedAccounts } = await supabase
      .from('device_fingerprints')
      .select('email', { count: 'exact', head: true })
      .eq('fingerprint', fingerprint)
      .eq('is_banned', true)
      .neq('email', email ?? '');

    return NextResponse.json({
      ok:              true,
      banned:          fpRow?.is_banned ?? false,
      sharedWithBanned: (bannedAccounts ?? 0) > 0,
    });

  } catch (err) {
    console.error('fingerprint route error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
