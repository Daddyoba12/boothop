import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getBizOtp, signBizOtp, signBizSession,
  getBizCookieName, getBizOtpCookieName,
  signBizRemember, getBizRememberCookieName,
} from '@/lib/auth/session';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pending     = getBizOtp(cookieStore);

    if (!pending) {
      return NextResponse.json({
        error: 'Verification code has expired. Please request a new one.',
      }, { status: 400 });
    }

    // Rate limit: max 5 attempts per OTP
    if (pending.attempts >= MAX_ATTEMPTS) {
      cookieStore.delete(getBizOtpCookieName());
      return NextResponse.json({
        error: 'Too many incorrect attempts. Please request a new code.',
      }, { status: 429 });
    }

    if (pending.code !== code.trim()) {
      // Increment attempts and re-issue the OTP cookie with same code
      const newToken = signBizOtp(pending.email, pending.code, pending.attempts + 1);
      const remaining = MAX_ATTEMPTS - (pending.attempts + 1);
      cookieStore.set(getBizOtpCookieName(), newToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   600,
        path:     '/',
      });
      return NextResponse.json({
        error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      }, { status: 400 });
    }

    // Code correct — issue business session
    const sessionToken = signBizSession(pending.email);

    cookieStore.set(getBizCookieName(), sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    });

    // Set 30-day remember-me cookie so future logins skip OTP
    cookieStore.set(getBizRememberCookieName(), signBizRemember(pending.email), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 30,
      path:     '/',
    });

    cookieStore.delete(getBizOtpCookieName());

    return NextResponse.json({ ok: true, email: pending.email });
  } catch (error) {
    console.error('business/auth/verify-otp error:', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
