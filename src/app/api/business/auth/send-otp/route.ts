import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signBizOtp, getBizOtpCookieName } from '@/lib/auth/session';
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

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    const code    = generateOtp();
    const token   = signBizOtp(email.toLowerCase(), code);

    await sendBusinessOtpEmail({ to: email, code });

    const cookieStore = await cookies();
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
