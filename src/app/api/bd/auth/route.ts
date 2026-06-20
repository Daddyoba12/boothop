import { sendResendEmail } from '@/lib/resend-client';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { signBdSession, getBdCookieName, BD_ALLOWED_EMAIL } from '@/lib/auth/session';
import crypto from 'crypto';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request: Request) {
  const { action, code } = await request.json();
  const supabase = createSupabaseAdminClient();

  // ── Send code ────────────────────────────────────────────────────────────────
  if (action === 'send') {
    const otp = generateCode();

    // Store hashed code (expires 15 min)
    await supabase.from('email_login_codes').delete().eq('email', BD_ALLOWED_EMAIL);
    await supabase.from('email_login_codes').insert({
      email:      BD_ALLOWED_EMAIL,
      code_hash:  hashCode(otp),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    const { error }  = await sendResendEmail({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      BD_ALLOWED_EMAIL,
      subject: `${otp} — Your BootHop BD Pipeline code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#7C3AED;margin:0 0 8px">BootHop BD Pipeline</h2>
          <p style="color:#6B7280;margin:0 0 24px">Your login code:</p>
          <div style="background:#F3F4F6;border-radius:12px;font-size:40px;font-weight:800;letter-spacing:8px;padding:24px;text-align:center;color:#111827">
            ${otp}
          </div>
          <p style="color:#9CA3AF;font-size:13px;margin:16px 0 0">Expires in 15 minutes. Do not share this code.</p>
        </div>`,
    });

    if (error) {
      console.error('BD auth email error:', error);
      return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // ── Verify code ───────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    }

    const { data: row } = await supabase
      .from('email_login_codes')
      .select('code_hash, expires_at')
      .eq('email', BD_ALLOWED_EMAIL)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'No code sent. Request a new one.' }, { status: 400 });
    }
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
    }
    if (row.code_hash !== hashCode(code.trim())) {
      return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
    }

    // Valid — delete code and set session cookie
    await supabase.from('email_login_codes').delete().eq('email', BD_ALLOWED_EMAIL);

    const token    = signBdSession(BD_ALLOWED_EMAIL);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getBdCookieName(), token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getBdCookieName(), '', { maxAge: 0, path: '/' });
  return response;
}
