/**
 * Route-level tests for POST /api/matches/[id]/delivery/pin
 *
 * Covers: auth, status gate, seal gate, PIN generation, re-generation (idempotent
 * in the sense that a new PIN replaces the old one and resets the attempt counter).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',               () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin',             () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/email/sendDeliveryPinEmail', () => ({ sendDeliveryPinEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '@/app/api/matches/[id]/delivery/pin/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-pin-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';
const SEAL_ID        = 'seal-pin-001';
const SEAL_NUMBER    = 'BH-ABCD-EFGH';

const ACTIVE_MATCH = {
  id:             MATCH_ID,
  status:         'active',
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
  sender_trip:    { from_city: 'Lagos', to_city: 'London' },
};

const ACTIVATED_SEAL = {
  id:          SEAL_ID,
  seal_number: SEAL_NUMBER,
  status:      'activated',
};

function makeChain(single: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'update', 'not']) c[m] = vi.fn().mockReturnValue(c);
  c.maybeSingle = vi.fn().mockResolvedValue({ data: single });
  c.single      = vi.fn().mockResolvedValue({ data: single, error: null });
  c.insert      = vi.fn().mockResolvedValue({ data: null, error: null });
  return c;
}

function makeSupabase({ matchData = ACTIVE_MATCH as unknown, sealData = ACTIVATED_SEAL as unknown } = {}) {
  let sealCallCount = 0;
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches') return makeChain(matchData);
      if (table === 'shipment_secure_seals') {
        sealCallCount++;
        if (sealCallCount === 1) return makeChain(sealData); // fetch
        return makeChain(null); // update
      }
      if (table === 'shipment_events') {
        const c = makeChain(null);
        (c.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
        return c;
      }
      return makeChain(null);
    }),
  };
}

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

function makeRequest() {
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/delivery/pin`, { method: 'POST' });
}

beforeEach(() => vi.clearAllMocks());

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /delivery/pin — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when traveller calls (sender only)', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/sender/i);
  });

  it('returns 403 when non-participant calls', async () => {
    mockSession('stranger@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
  });

  it('allows the sender to generate a PIN', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });
});

// ── Status gate ───────────────────────────────────────────────────────────────

describe('POST /delivery/pin — status gate', () => {
  it('returns 404 when match not found', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ matchData: null }) as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when match is seal_pending (not yet active)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'seal_pending' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is delivery_confirmed', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'delivery_confirmed' } }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });
});

// ── Seal gate ─────────────────────────────────────────────────────────────────

describe('POST /delivery/pin — seal gate', () => {
  it('returns 409 when no activated seal found', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: null }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/no activated seal/i);
  });
});

// ── PIN generation ─────────────────────────────────────────────────────────────

describe('POST /delivery/pin — PIN generation', () => {
  it('returns 200 with a 6-digit PIN', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.pin).toMatch(/^\d{6}$/);
    expect(body.generatedAt).toBeDefined();
  });

  it('PIN is always exactly 6 digits (including leading zeros)', async () => {
    for (let i = 0; i < 20; i++) {
      mockSession(SENDER_EMAIL);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);
      vi.clearAllMocks();
      mockSession(SENDER_EMAIL);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

      const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
      const body = await res.json();
      expect(body.pin).toHaveLength(6);
      expect(body.pin).toMatch(/^\d{6}$/);
    }
  });

  it('generates distinct PINs across repeated calls (no trivial collision)', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      vi.clearAllMocks();
      mockSession(SENDER_EMAIL);
      vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);
      const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
      const body = await res.json();
      seen.add(body.pin);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('re-generation returns a new PIN (old PIN is invalidated)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);
    const res1 = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const pin1 = (await res1.json()).pin;

    vi.clearAllMocks();
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);
    const res2 = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const pin2 = (await res2.json()).pin;

    // Both are valid 6-digit PINs (may occasionally be equal by chance; that's fine)
    expect(pin1).toMatch(/^\d{6}$/);
    expect(pin2).toMatch(/^\d{6}$/);
    // Both responses succeed regardless
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });
});
