/**
 * Route-level tests for GET /api/matches/[id]/seal/current
 *
 * Covers: auth, access control (both parties), no-seal case, response shape,
 * and a critical field-level assertion that the raw token is never returned.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers',         () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',   () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));

import { GET } from '@/app/api/matches/[id]/seal/current/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-current-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

const BASE_MATCH = {
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
};

const GENERATED_SEAL = {
  id:                  'seal-001',
  seal_number:         'BH-ABCD-EFGH',
  status:              'generated',
  generated_at:        '2026-07-23T10:00:00Z',
  expires_at:          '2026-07-30T10:00:00Z',
  activated_at:        null,
  sender_confirmed_at: null,
  // token_hash is intentionally NOT in the SELECT — see route.ts
};

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

function makeChain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'not', 'maybeSingle', 'order', 'limit']) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: result });
  return c;
}

function makeSupabase(matchData: unknown = BASE_MATCH, sealData: unknown = GENERATED_SEAL) {
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches') return makeChain(matchData);
      if (table === 'shipment_secure_seals') {
        callCount++;
        return makeChain(sealData);
      }
      return makeChain(null);
    }),
  };
}

function makeRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/seal/current`, { method: 'GET' });
}

beforeEach(() => vi.clearAllMocks());

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('GET /seal/current — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });
});

// ── Access control ────────────────────────────────────────────────────────────

describe('GET /seal/current — access control', () => {
  it('returns 403 when caller is not a match participant', async () => {
    mockSession('stranger@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
  });

  it('allows the traveller to view the seal', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });

  it('allows the sender to view the seal', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 when match does not exist', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(null) as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });
});

// ── Response shape ────────────────────────────────────────────────────────────

describe('GET /seal/current — response shape', () => {
  it('returns seal data with expected fields when a seal exists', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    expect(body.seal).not.toBeNull();
    expect(body.seal.seal_number).toBe('BH-ABCD-EFGH');
    expect(body.seal.status).toBe('generated');
    expect(body.seal.generated_at).toBeDefined();
    expect(body.seal.expires_at).toBeDefined();
  });

  it('returns null seal when no non-revoked/expired seal exists', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(BASE_MATCH, null) as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(body.seal).toBeNull();
  });

  // ── Critical: raw token must never appear in this response ────────────────
  it('response does not contain a raw token field (token is one-time delivery via /generate only)', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    // Neither 'token' nor 'token_hash' may appear anywhere in the response body
    expect(body).not.toHaveProperty('token');
    expect(body).not.toHaveProperty('token_hash');
    if (body.seal) {
      expect(body.seal).not.toHaveProperty('token');
      expect(body.seal).not.toHaveProperty('token_hash');
    }
  });

  it('returns activated_at as null when seal is not yet activated', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(body.seal.activated_at).toBeNull();
  });

  it('returns sender_confirmed_at as null when sender has not confirmed', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(body.seal.sender_confirmed_at).toBeNull();
  });
});
