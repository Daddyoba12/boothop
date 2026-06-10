import { getRedis } from './redis';

// Sliding-window rate limiter backed by Upstash Redis.
// Returns { allowed: true } or { allowed: false, retryAfter: seconds }.

export async function checkRateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const redis  = getRedis();
    const now    = Date.now();
    const floor  = now - windowMs;
    const rKey   = `rl:${key}`;

    // Remove entries outside the window, then count + add current timestamp
    await redis.zremrangebyscore(rKey, 0, floor);
    const count = await redis.zcard(rKey);

    if (count >= limit) {
      // Find when the oldest entry in the window expires
      const oldest = await redis.zrange<number[]>(rKey, 0, 0, { withScores: true });
      const oldestTs = (oldest?.[1] as number) ?? now;
      const retryAfter = Math.ceil((oldestTs + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Add this request and set TTL so the key auto-cleans
    await redis.zadd(rKey, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(rKey, Math.ceil(windowMs / 1000));

    return { allowed: true };
  } catch {
    // Redis down → fail open (don't block users due to infra issue)
    return { allowed: true };
  }
}

// Convenience wrappers for the two message rate limits:

// Per-user per-match: max 30 messages in any 5-minute window
export const checkMessageLimit = (email: string, matchId: string) =>
  checkRateLimit(`msg:${email}:${matchId}`, 30, 5 * 60 * 1000);

// Per-user global: max 120 messages per hour across all matches
export const checkGlobalMessageLimit = (email: string) =>
  checkRateLimit(`msg:global:${email}`, 120, 60 * 60 * 1000);
