import crypto from 'crypto';

// 31-char unambiguous alphabet: excludes 0/O, 1/I/L (all visually ambiguous pairs).
// 256 % 31 = 8 → chars at index 0-7 appear 9/256 vs 8/256 for the rest (~0.4% bias, acceptable for seal numbers).
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateSealNumber(): string {
  const bytes = crypto.randomBytes(8);
  const chars = Array.from(bytes).map(b => CHARSET[b % 31]);
  return `BH-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export function generateSealToken(): { rawToken: string; tokenHash: string } {
  const rawToken  = crypto.randomBytes(32).toString('hex'); // 64-char hex, never stored
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
