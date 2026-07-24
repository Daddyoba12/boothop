/**
 * Route-level tests for POST /api/matches/[id]/seal/generate
 *
 * Covers: auth, status gate, idempotency, token security, seal number format,
 * rate limiting bypass (mocked), and expiry data model.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }) }));
// Don't mock seals/generate — we want to test the real generator

import { POST } from '@/app/api/matches/[id]/seal/generate/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSealNumber, generateSealToken, hashToken } from '@/lib/seals/generate';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MATCH_ID     = 'match-seal-001';
const SENDER_EMAIL = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

function makeRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/seal/generate`, { method: 'POST' });
}

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

const ACTIVE_MATCH = {
  id:             MATCH_ID,
  status:         'seal_pending',
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
};

// Builds a chainable Supabase mock with configurable per-table responses
function makeSupabase({
  matchData          = ACTIVE_MATCH as unknown,
  existingSeal       = null as unknown,
  sealNumberCollision = false,
  insertedSeal       = null as unknown,
} = {}) {
  let matchChain: Record<string, unknown>;
  let existingSealChain: Record<string, unknown>;
  let collisionChain:    Record<string, unknown>;
  let insertChain:       Record<string, unknown>;
  let eventsChain:       Record<string, unknown>;

  const makeChain = (result: unknown, insertResult: unknown = null) => {
    const c: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'update', 'not'];
    for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
    c.maybeSingle = vi.fn().mockResolvedValue({ data: result });
    c.single      = vi.fn().mockResolvedValue({ data: insertResult, error: null });
    c.insert      = vi.fn().mockReturnValue(c);
    return c;
  };

  matchChain      = makeChain(matchData);
  existingSealChain = makeChain(existingSeal);
  collisionChain  = makeChain(sealNumberCollision ? { id: 'existing' } : null);

  const defaultSeal = insertedSeal ?? {
    id:           'new-seal-id',
    seal_number:  'BH-TEST-0001',
    generated_at: new Date().toISOString(),
    expires_at:   new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  };
  insertChain = makeChain(null, defaultSeal);
  (insertChain.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

  eventsChain = makeChain(null);
  (eventsChain.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });

  let callCount = 0;
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches')               return matchChain;
      if (table === 'shipment_events')       return eventsChain;
      if (table === 'shipment_secure_seals') {
        callCount++;
        // 1st call: existingSeal check (.not().maybeSingle())
        // 2nd call: seal_number collision check (.eq().maybeSingle())
        // 3rd call: insert
        if (callCount === 1) return existingSealChain;
        if (callCount === 2) return collisionChain;
        return insertChain;
      }
      return makeChain(null);
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
});

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /seal/generate — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a match participant', async () => {
    mockSession('stranger@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
  });

  it('allows the sender to generate a seal', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });

  it('allows the traveler to generate a seal', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });
});

// ── Status gate ───────────────────────────────────────────────────────────────

describe('POST /seal/generate — status gate', () => {
  it('returns 409 when match is inspection_pending (inspection not yet complete)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'inspection_pending' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is active (seal_pending required — active means already sealed)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'active' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is compliance_in_progress', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'compliance_in_progress' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is external_verification_required', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'external_verification_required' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 404 when match does not exist', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ matchData: null }) as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });
});

// ── Token security ────────────────────────────────────────────────────────────

describe('POST /seal/generate — token security', () => {
  it('response includes the raw token (for QR rendering)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });

  it('token and token_hash are different values', () => {
    const { rawToken, tokenHash } = generateSealToken();
    expect(rawToken).not.toBe(tokenHash);
    expect(rawToken).toHaveLength(64); // 32 bytes → 64 hex chars
    expect(tokenHash).toHaveLength(64); // SHA-256 → 64 hex chars
  });

  it('hashing the same raw token always produces the same hash', () => {
    const { rawToken, tokenHash } = generateSealToken();
    expect(hashToken(rawToken)).toBe(tokenHash);
  });

  it('two different tokens produce different hashes', () => {
    const a = generateSealToken();
    const b = generateSealToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it('printUrl in response includes the raw token', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(body.printUrl).toContain(`?t=${body.token}`);
    expect(body.printUrl).toContain(MATCH_ID);
  });
});

// ── Seal number format ────────────────────────────────────────────────────────

describe('generateSealNumber — format and character set', () => {
  it('matches the BH-XXXX-XXXX format', () => {
    for (let i = 0; i < 20; i++) {
      const n = generateSealNumber();
      // [A-HJ-KM-NP-Z2-9] covers all chars in our 31-char alphabet (excludes 0,1,I,L,O)
      expect(n).toMatch(/^BH-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/);
    }
  });

  it('never contains ambiguous characters 0, 1, I, L, O', () => {
    for (let i = 0; i < 100; i++) {
      const n = generateSealNumber();
      const body = n.replace(/BH-|-/g, '');
      expect(body).not.toMatch(/[01ILO]/);
    }
  });

  it('generates distinct values across many calls (no trivial collision)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(generateSealNumber());
    // 200 calls should yield 200 distinct numbers
    expect(seen.size).toBe(200);
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────────

describe('POST /seal/generate — idempotency', () => {
  it('returns idempotent: true with existing seal_number when seal already exists', async () => {
    mockSession(SENDER_EMAIL);
    const existingSeal = {
      id:           'existing-seal-id',
      seal_number:  'BH-ABCD-EFGH',
      status:       'generated',
      generated_at: new Date().toISOString(),
      expires_at:   new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    };

    // Build supabase mock where the update call works
    const existingSealChain: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'not', 'update'];
    for (const m of methods) existingSealChain[m] = vi.fn().mockReturnValue(existingSealChain);
    existingSealChain.maybeSingle = vi.fn().mockResolvedValue({ data: existingSeal });
    existingSealChain.insert = vi.fn().mockReturnValue(existingSealChain);

    const matchChain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'maybeSingle']) matchChain[m] = vi.fn().mockReturnValue(matchChain);
    (matchChain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: ACTIVE_MATCH });

    const supabaseMock = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'matches') return matchChain;
        if (table === 'shipment_secure_seals') return existingSealChain;
        return { select: vi.fn().mockReturnThis(), insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
      }),
    };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(supabaseMock as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.idempotent).toBe(true);
    expect(body.sealNumber).toBe('BH-ABCD-EFGH');
    // A fresh token is returned so the user always has a working print URL
    expect(body.token).toBeDefined();
    expect(body.printUrl).toContain(`?t=${body.token}`);
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('POST /seal/generate — rate limiting', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 45 });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('45');
  });
});

// ── Expiry data model ─────────────────────────────────────────────────────────

describe('POST /seal/generate — expiry', () => {
  it('expiresAt in response is approximately 7 days from now', async () => {
    mockSession(SENDER_EMAIL);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sealWithFutureExpiry = {
      id:           'seal-expiry-test',
      seal_number:  'BH-EXPX-XXXX',
      generated_at: new Date().toISOString(),
      expires_at:   sevenDaysFromNow.toISOString(),
    };

    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ insertedSeal: sealWithFutureExpiry }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    const expiresAt = new Date(body.expiresAt);
    const diffDays  = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    // Within a few seconds of 7 days
    expect(diffDays).toBeGreaterThan(6.99);
    expect(diffDays).toBeLessThan(7.01);
  });

  it('an expired seal (past expires_at) is detectable from the data model', () => {
    const expiredSeal = {
      status:     'generated', // status not yet updated to 'expired' (done lazily at scan time)
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    // Application-level expiry check mirrors what the print page does
    const isExpired = expiredSeal.status === 'expired' || new Date(expiredSeal.expires_at) < new Date();
    expect(isExpired).toBe(true);
  });
});

// ── Seal response shape ───────────────────────────────────────────────────────

describe('POST /seal/generate — response shape', () => {
  it('successful response contains sealNumber, token, generatedAt, expiresAt, printUrl', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sealNumber).toBeDefined();
    expect(body.token).toBeDefined();
    expect(body.generatedAt).toBeDefined();
    expect(body.expiresAt).toBeDefined();
    expect(body.printUrl).toBeDefined();
  });
});
