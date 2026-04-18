import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getSessionCookieName, signAppSession,
  getAppRememberCookieName, signAppRemember,
} from '@/lib/auth/session';
import { hashCode, normalizeEmail } from '@/lib/auth/code';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email || '');
    const code = String(body?.code || '').trim().toUpperCase();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    const { data: record, error: selectError } = await supabase
      .from('email_login_codes')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gte('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) throw selectError;

    if (!record) {
      return NextResponse.json({ error: 'Code is invalid or has expired.' }, { status: 400 });
    }

    if (record.attempts >= record.max_attempts) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 429 });
    }

    const incomingHash = hashCode(code);
    if (incomingHash !== record.code_hash) {
      await supabase
        .from('email_login_codes')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);

      return NextResponse.json({ error: 'Incorrect verification code.' }, { status: 400 });
    }

    await supabase
      .from('email_login_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', record.id);

    // Save journey and publish as a live trip if the user came from the register form
    let hasDraft = false;
    if (record.journey_payload) {
      const p = record.journey_payload as any;
      const priceNum = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || null;

      // Custom OTP users are not in Supabase Auth — user_id is nullable
      const userId = null;

      // journey_drafts — best-effort fire and forget
      supabase.from('journey_drafts').insert({
        email,
        payload: { ...p, user_id: userId, priceNum },
      }).then();

      // Publish as a live trip
      const { error: tripErr } = await supabase.from('trips').insert({
        email,
        user_id:     userId,
        type:        p.mode || 'send',
        from_city:   p.from || '',
        to_city:     p.to  || '',
        travel_date: p.date,
        weight:      p.weight || null,
        price:       priceNum,
        status:      'active',
      });

      if (tripErr) {
        // Surface the real DB error so we can diagnose it
        return NextResponse.json(
          { error: `Trip save failed: ${tripErr.message}` },
          { status: 500 },
        );
      }

      hasDraft = true;

      // Fire auto-match cron inline (best-effort, non-blocking)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      if (appUrl && process.env.CRON_SECRET) {
        fetch(`${appUrl}/api/cron/auto-match`, {
          headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
        }).catch((e) => console.error('auto-match trigger failed', e));
      }
    }

    // Always go to dashboard — it handles both new and returning users
    const redirectTo = hasDraft ? '/dashboard?listing=new' : '/dashboard';

    const token = signAppSession({ email, verified: true });

    const response = NextResponse.json({
      ok: true,
      email,
      hasDraft,
      tripSaved: hasDraft,
      journeyPayload: record.journey_payload,
      redirectTo,
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 7,
    });

    // 30-day remember-me — future logins will skip OTP for this device
    response.cookies.set(getAppRememberCookieName(), signAppRemember(email), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 30,
    });

    return response;

  } catch (error) {
    console.error('verify-code error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify code.' },
      { status: 500 },
    );
  }
}