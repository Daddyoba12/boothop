import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signBizOtp, getBizOtp, getBizOtpCookieName, getBizRemember, signBizSession, getBizCookieName } from '@/lib/auth/session';
import { generateVerificationCode, hashCode } from '@/lib/auth/code';
import { sendBusinessOtpEmail } from '@/lib/email/sendBusinessEmail';

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.co.uk',
  'live.com', 'live.co.uk',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aol.co.uk',
  'protonmail.com', 'proton.me',
  'msn.com',
  'btinternet.com', 'virginmedia.com', 'sky.com',
  'ntlworld.com', 'talktalk.net',
]);

function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PERSONAL_DOMAINS.has(domain);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }

    if (!isBusinessEmail(email.toLowerCase())) {
      return NextResponse.json({
        error: 'Personal email addresses are not accepted. Please use your business email.',
      }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Check remember-me cookie — skip OTP for trusted returning users
    const remembered = getBizRemember(cookieStore);
    if (remembered && remembered.email === email.toLowerCase()) {
      const sessionToken = signBizSession(remembered.email);
      cookieStore.set(getBizCookieName(), sessionToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 7,
        path:     '/',
      });
      return NextResponse.json({ ok: true, skipOtp: true, email: remembered.email });
    }

    // Rate limit: prevent resending within 60 seconds
    const existing = getBizOtp(cookieStore);
    if (existing?.iat) {
      const secondsSinceIssued = Math.floor(Date.now() / 1000) - existing.iat;
      if (secondsSinceIssued < 60) {
        return NextResponse.json({
          error: `Please wait ${60 - secondsSinceIssued} seconds before requesting a new code.`,
        }, { status: 429 });
      }
    }

    // Same format as the main app: 4 digits + 1 letter (e.g. 4827A)
    const code  = generateVerificationCode();
    const token = signBizOtp(email.toLowerCase(), hashCode(code));

    await sendBusinessOtpEmail({ to: email, code });

    cookieStore.set(getBizOtpCookieName(), token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600, // 10 minutes
      path:     '/',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('business/auth/send-otp error:', error);
    return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
  }
}
