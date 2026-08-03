import jwt from 'jsonwebtoken';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const COOKIE = 'boothop_admin_session';

export interface AdminSession {
  adminId:        string;
  email:          string;
  isTempPassword: boolean;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    const hashBuffer   = Buffer.from(hash, 'hex');
    const derivedHash  = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derivedHash);
  } catch {
    return false;
  }
}

export function signAdminSession(payload: AdminSession): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET missing');
  return jwt.sign({ ...payload, admin: true }, secret, {
    expiresIn: '8h',
    issuer:    'boothop',
    audience:  'boothop-admin',
  });
}

export function verifyAdminSession(token: string): AdminSession | null {
  try {
    const secret = process.env.APP_SESSION_SECRET;
    if (!secret) return null;
    const p = jwt.verify(token, secret, {
      issuer:   'boothop',
      audience: 'boothop-admin',
    }) as AdminSession & { admin: true };
    return { adminId: p.adminId, email: p.email, isTempPassword: p.isTempPassword ?? false };
  } catch {
    return null;
  }
}

export function getAdminSession(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): AdminSession | null {
  const cookie = cookieStore.get(COOKIE);
  if (!cookie?.value) return null;
  return verifyAdminSession(cookie.value);
}

export function getAdminCookieName() { return COOKIE; }
