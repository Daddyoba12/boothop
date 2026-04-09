import jwt from 'jsonwebtoken';

export type AppSessionPayload = {
  email: string;
  verified: true;
};

const COOKIE_NAME = 'boothop_session';

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function signAppSession(payload: AppSessionPayload) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is missing');

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    issuer: 'boothop',
    audience: 'boothop-users',
  });
}

export function verifyAppSession(token: string): AppSessionPayload {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is missing');

  return jwt.verify(token, secret, {
    issuer: 'boothop',
    audience: 'boothop-users',
  }) as AppSessionPayload;
}

export function getAppSession(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): AppSessionPayload | null {
  try {
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    return verifyAppSession(cookie.value);
  } catch {
    return null;
  }
}

// ── Business portal session ───────────────────────────────────────────────────
const BIZ_COOKIE   = 'boothop_biz_session';
const BIZ_OTP_COOKIE = 'boothop_biz_otp';

export type BizSessionPayload = { email: string; business: true };

export function getBizCookieName()    { return BIZ_COOKIE; }
export function getBizOtpCookieName() { return BIZ_OTP_COOKIE; }

export function signBizSession(email: string) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is missing');
  return jwt.sign({ email, business: true } as BizSessionPayload, secret, {
    expiresIn: '7d', issuer: 'boothop', audience: 'boothop-business',
  });
}

export function signBizOtp(email: string, code: string, attempts = 0) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is missing');
  return jwt.sign({ email, code, attempts, type: 'biz_otp' }, secret, {
    expiresIn: '10m', issuer: 'boothop', audience: 'boothop-business',
  });
}

export function getBizSession(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): BizSessionPayload | null {
  try {
    const cookie = cookieStore.get(BIZ_COOKIE);
    if (!cookie?.value) return null;
    return jwt.verify(cookie.value, process.env.APP_SESSION_SECRET!, {
      issuer: 'boothop', audience: 'boothop-business',
    }) as BizSessionPayload;
  } catch { return null; }
}

// ── Business remember-me cookie (30 days, skips OTP on return visits) ────────
const BIZ_REMEMBER_COOKIE = 'boothop_biz_remember';

export function getBizRememberCookieName() { return BIZ_REMEMBER_COOKIE; }

export function signBizRemember(email: string) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET is missing');
  return jwt.sign({ email, type: 'biz_remember' }, secret, {
    expiresIn: '30d', issuer: 'boothop', audience: 'boothop-business',
  });
}

export function getBizRemember(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): { email: string } | null {
  try {
    const cookie = cookieStore.get(BIZ_REMEMBER_COOKIE);
    if (!cookie?.value) return null;
    const payload = jwt.verify(cookie.value, process.env.APP_SESSION_SECRET!, {
      issuer: 'boothop', audience: 'boothop-business',
    }) as { email: string; type: string };
    if (payload.type !== 'biz_remember') return null;
    return { email: payload.email };
  } catch { return null; }
}

export function getBizOtp(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): { email: string; code: string; attempts: number; iat?: number } | null {
  try {
    const cookie = cookieStore.get(BIZ_OTP_COOKIE);
    if (!cookie?.value) return null;
    return jwt.verify(cookie.value, process.env.APP_SESSION_SECRET!, {
      issuer: 'boothop', audience: 'boothop-business',
    }) as { email: string; code: string; attempts: number; iat?: number };
  } catch { return null; }
}
