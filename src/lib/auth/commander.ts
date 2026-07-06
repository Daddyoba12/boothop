import jwt from 'jsonwebtoken';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const COOKIE = 'boothop_commander_session';

export interface CommanderSession {
  clientId: string;
  slug:     string;
  company:  string;
  email:    string;
  isSuper:  boolean;
}

// ── Password hashing ──────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    const hashBuffer  = Buffer.from(hash, 'hex');
    const derivedHash = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derivedHash);
  } catch {
    return false;
  }
}

// ── JWT session cookie ────────────────────────────────────────────────────────

export function signCommanderSession(payload: CommanderSession): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error('APP_SESSION_SECRET missing');
  return jwt.sign({ ...payload, commander: true }, secret, {
    expiresIn: '7d',
    issuer:    'boothop',
    audience:  'boothop-commander',
  });
}

export function verifyCommanderSession(token: string): CommanderSession | null {
  try {
    const secret = process.env.APP_SESSION_SECRET;
    if (!secret) return null;
    const p = jwt.verify(token, secret, {
      issuer:   'boothop',
      audience: 'boothop-commander',
    }) as CommanderSession & { commander: true };
    return { clientId: p.clientId, slug: p.slug, company: p.company, email: p.email, isSuper: p.isSuper ?? false };
  } catch {
    return null;
  }
}

export function getCommanderSession(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): CommanderSession | null {
  const cookie = cookieStore.get(COOKIE);
  if (!cookie?.value) return null;
  return verifyCommanderSession(cookie.value);
}

export function getCommanderCookieName() { return COOKIE; }
