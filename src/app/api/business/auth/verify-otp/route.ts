import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getBizOtp, signBizSession,
  getBizCookieName, getBizOtpCookieName,
} from '@/lib/auth/session';

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

    if (pending.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Issue business session
    const sessionToken = signBizSession(pending.email);

    cookieStore.set(getBizCookieName(), sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    });

    // Clear OTP cookie
    cookieStore.delete(getBizOtpCookieName());

    return NextResponse.json({ ok: true, email: pending.email });
  } catch (error) {
    console.error('business/auth/verify-otp error:', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
