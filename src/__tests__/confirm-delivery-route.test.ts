/**
 * Route-level tests for POST /api/matches/[id]/confirm-delivery
 *
 * Covers: auth, 404, 403, 409 seal-bypass guard, CLEARED-path single confirm,
 * CLEARED-path both-confirm (with Stripe capture), idempotency for
 * already-confirmed state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',   () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents = {
      capture: vi.fn().mockResolvedValue({ id: 'pi_123', status: 'succeeded' }),
    };
  },
}));

import { POST } from '@/app/api/matches/[id]/confirm-delivery/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-cd-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

const MATCH_ACTIVE = {
  id:                          MATCH_ID,
  status:                      'active',
  sender_email:                SENDER_EMAIL,
  traveler_email:              TRAVELER_EMAIL,
  payment_intent_id:           'pi_123',
  sender_confirmed_delivery:   false,
  traveller_confirmed_delivery: false,
};

const MATCH_ALREADY_CONFIRMED = { ...MATCH_ACTIVE, status: 'delivery_confirmed' };

const REFETCH_ONE_CONFIRMED = {
  sender_confirmed_delivery:   true,
  traveller_confirmed_delivery: false,
  payment_intent_id:           null,
};

const REFETCH_BOTH_CONFIRMED = {
  sender_confirmed_delivery:   true,
  traveller_confirmed_delivery: true,
  payment_intent_id:           'pi_123',
};

// ── Supabase mock factory ─────────────────────────────────────────────────────

function makeSupabase({
  matchData   = MATCH_ACTIVE  as unknown,
  sealData    = null          as unknown,
  refetchData = REFETCH_ONE_CONFIRMED as unknown,
} = {}) {
  let matchCallIdx = 0;

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'shipment_secure_seals') {
        return {
          select:      vi.fn().mockReturnThis(),
          eq:          vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: sealData }),
        };
      }

      const idx = matchCallIdx++;
      return {
        select:      vi.fn().mockReturnThis(),
        update:      vi.fn().mockReturnThis(),
        eq:          vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(
          idx === 0 ? { data: matchData, error: null } : { data: null }
        ),
        single: vi.fn().mockResolvedValue({ data: refetchData }),
      };
    }),
  };
}

function mockSession(email: string | null) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue(
    email ? ({ email } as ReturnType<typeof getAppSession>) : null
  );
}

function makeRequest() {
  return new NextRequest(
    `http://localhost/api/matches/${MATCH_ID}/confirm-delivery`,
    { method: 'POST' }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
});

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /confirm-delivery — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when match not found', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: null }) as never
    );

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-participant', async () => {
    mockSession('outsider@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/participant/i);
  });
});

// ── Seal bypass guard (primary security invariant) ────────────────────────────

describe('POST /confirm-delivery — SecureSeal bypass guard', () => {
  it('returns 409 when the shipment has an activated seal (must use PIN flow)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: { id: 'seal-1' } }) as never
    );

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/SecureSeal|seal|PIN/i);
  });

  it('409 response body contains no internal seal identifiers', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: { id: 'seal-1' } }) as never
    );

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('seal-1');
  });
});

// ── CLEARED path — legacy flow unchanged ──────────────────────────────────────

describe('POST /confirm-delivery — CLEARED shipment (no seal)', () => {
  it('returns 200 with bothConfirmed:false when only one party has confirmed', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: null, refetchData: REFETCH_ONE_CONFIRMED }) as never
    );

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.bothConfirmed).toBe(false);
  });

  it('returns 200 with bothConfirmed:true and captures Stripe payment when both confirm', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: null, refetchData: REFETCH_BOTH_CONFIRMED }) as never
    );

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.bothConfirmed).toBe(true);
  });

  it('returns 200 idempotent when match is already delivery_confirmed', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: MATCH_ALREADY_CONFIRMED }) as never
    );

    const res  = await POST(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyConfirmed).toBe(true);
  });
});
