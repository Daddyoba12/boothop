import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ── Webhook idempotency ────────────────────────────────────────────────────

const EVENT_TTL      = 7 * 24 * 3600;   // 7 days
const PROCESSING_TTL = 300;             // 5 min lock while processing

type EventStatus = 'processing' | 'processed' | 'failed';

export async function getWebhookEventStatus(eventId: string): Promise<EventStatus | null> {
  try {
    return (await getRedis().get<EventStatus>(`stripe:event:${eventId}`));
  } catch { return null; }
}

export async function setWebhookEventStatus(eventId: string, status: EventStatus): Promise<void> {
  try {
    const ttl = status === 'processing' ? PROCESSING_TTL : EVENT_TTL;
    await getRedis().set(`stripe:event:${eventId}`, status, { ex: ttl });
  } catch { /* non-fatal — processing continues */ }
}

export async function pushFailedEvent(eventId: string): Promise<void> {
  try {
    await getRedis().lpush('stripe:failed_events', eventId);
    await getRedis().expire('stripe:failed_events', EVENT_TTL);
  } catch { /* non-fatal */ }
}

export async function popFailedEvents(limit = 20): Promise<string[]> {
  try {
    const redis = getRedis();
    const ids = await redis.lrange<string>('stripe:failed_events', 0, limit - 1);
    if (ids.length > 0) {
      await redis.ltrim('stripe:failed_events', ids.length, -1);
    }
    return ids;
  } catch { return []; }
}
