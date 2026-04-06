import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSessionCookieName, signAppSession } from '@/lib/auth/session';
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
      try {
        const { data: authUser } = await (supabase.auth.admin as any)
          .getUserByEmail(email)
          .catch(() => ({ data: null }));

        const userId = authUser?.user?.id ?? null; // 🔥 PATCH (safe fallback)

        const p = record.journey_payload as any;
        const priceNum =
          parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || null;

        // Keep journey_drafts for match-engine reference (best-effort)
        supabase.from('journey_drafts').insert({
          email,
          user_id:       userId,
          type:          p.mode || 'send',
          from_city:     p.from || '',
          to_city:       p.to  || '',
          travel_date:   p.date || null,
          weight:        p.weight || null,
          price:         priceNum,
          interested_in: p.interestedIn || null,
          status:        'draft',
          expires_at:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }).then();

        // Publish the trip as a live listing so it appears on /journeys
        const { error: tripErr } = await supabase.from('trips').insert({
          email,
          user_id:      userId,
          type:         p.mode || 'send',
          from_city:    p.from || '',
          to_city:      p.to  || '',
          travel_date:  p.date || null,
          weight:       p.weight || null,
          price:        priceNum,
        });

        if (tripErr) {
          console.error('❌ Trip insert error:', {
            message: tripErr.message,
            details: tripErr.details,
            hint: tripErr.hint,
          });

          // 🔥 PATCH: stop silent failure
          return NextResponse.json(
            { error: 'Failed to create trip. Please try again.' },
            { status: 500 }
          );
        }

        hasDraft = true;
      } catch (draftErr) {
        console.error('Draft save failed (non-blocking):', draftErr);
      }
    }

    // Decide redirect:
    let redirectTo = '/dashboard';
    if (hasDraft) {
      redirectTo = '/journeys?listing=new';
    } else {
      const { count: tripCount } = await supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
        .limit(1);

      if ((tripCount ?? 0) === 0) redirectTo = '/journeys';
    }

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

    return response;

  } catch (error) {
    console.error('verify-code error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify code.' },
      { status: 500 },
    );
  }
}