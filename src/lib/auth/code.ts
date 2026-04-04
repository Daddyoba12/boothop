import crypto from 'crypto';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateVerificationCode(): string {
  const digits = crypto.randomInt(1000, 10000).toString();
  const letter = LETTERS[crypto.randomInt(0, LETTERS.length)];
  return `${digits}${letter}`;
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
