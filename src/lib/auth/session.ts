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
