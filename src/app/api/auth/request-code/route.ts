import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateVerificationCode, hashCode, normalizeEmail } from '@/lib/auth/code';
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail';

const WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email || '');
    const journeyPayload = body?.journeyPayload ?? null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request.headers.get('user-agent') || null;
    const recentCutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from('email_login_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', recentCutoff);

    if (countError) throw countError;

    if ((count || 0) >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Too many code requests. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const verifyUrl = `${origin}/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;

    const { error: insertError } = await supabase.from('email_login_codes').insert({
      email,
      code,
      code_hash: hashCode(code),
      expires_at: expiresAt,
      used: false,
      ip_address: ip,
      user_agent: userAgent,
      journey_payload: journeyPayload,
      purpose: 'login',
    });

    if (insertError) throw insertError;

    await sendVerificationEmail({ to: email, code, verifyUrl });

    return NextResponse.json({
      ok: true,
      email,
      expiresInMinutes: 10,
      message: 'Verification code sent.',
    });
  } catch (error) {
    console.error('request-code error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send code.' },
      { status: 500 },
    );
  }
}
