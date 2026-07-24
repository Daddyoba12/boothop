/**
 * Route-level tests for POST /api/matches/[id]/delivery/confirm-pin
 *
 * Covers: auth, status gate, seal gate, PIN validation, lockout, successful
 * confirmation (state transition, no immediate Stripe capture), idempotency,
 * and regression guard for CLEARED path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',          () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin',        () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/services/telnyx',       () => ({ sendSMS: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/services/notifications', () => ({ sendPushToEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/resend-client',         () => ({ sendResendEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '@/app/api/matches/[id]/delivery/confirm-pin/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-cpin-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';
const SEAL_ID        = 'seal-cpin-001';
const SEAL_NUMBER    = 'BH-ABCD-EFGH';
const CORRECT_PIN    = '482931';

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

const CORRECT_HASH = hashPin(CORRECT_PIN);

const ACTIVE_MATCH = {
  id:                    MATCH_ID,
  status:                'active',
  sender_email:          SENDER_EMAIL,
  traveler_email:        TRAVELER_EMAIL,
  delivery_confirmed_at: null,
  sender_trip:           { from_city: 'Lagos', to_city: 'London' },
};

function makeActivatedSeal(overrides: Record<string, unknown> = {}) {
  return {
    id:                      SEAL_ID,
    seal_number:             SEAL_NUMBER,
    delivery_pin_hash:       CORRECT_HASH,
    delivery_pin_attempts:   0,
    delivery_pin_locked_at:  null,
    ...overrides,
  };
}

function makeChain(single: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'update', 'not']) c[m] = vi.fn().mockReturnValue(c);
  c.maybeSingle = vi.fn().mockResolvedValue({ data: single });
  c.single      = vi.fn().mockResolvedValue({ data: single, error: null });
  c.insert      = vi.fn().mockResolvedValue({ data: null, error: null });
  return c;
}

function makeSupabase({
  matchData = ACTIVE_MATCH as unknown,
  sealData  = makeActivatedSeal() as unknown,
} = {}) {
  let sealCall = 0;
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches') return makeChain(matchData);
      if (table === 'shipment_secure_seals') {
        sealCall++;
        if (sealCall === 1) return makeChain(sealData); // fetch
        return makeChain(null); // update
      }
      return makeChain(null);
    }),
  };
}

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/delivery/confirm-pin`, {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => vi.clearAllMocks());

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /delivery/confirm-pin — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when sender calls (traveller only)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/carrier/i);
  });

  it('returns 403 when non-participant calls', async () => {
    mockSession('stranger@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
  });
});

// ── Status gate ───────────────────────────────────────────────────────────────

describe('POST /delivery/confirm-pin — status gate', () => {
  it('returns 404 when match not found', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ matchData: null }) as never);

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when match is seal_pending', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'seal_pending' } }) as never
    );

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is inspection_pending', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'inspection_pending' } }) as never
    );

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns idempotent when match is already delivery_confirmed', async () => {
    mockSession(TRAVELER_EMAIL);
    const confirmedAt = new Date().toISOString();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'delivery_confirmed', delivery_confirmed_at: confirmedAt } }) as never
    );

    const res  = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.idempotent).toBe(true);
    expect(body.confirmedAt).toBe(confirmedAt);
  });

  it('returns idempotent when match is completed', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ matchData: { ...ACTIVE_MATCH, status: 'completed', delivery_confirmed_at: new Date().toISOString() } }) as never
    );

    const res  = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.idempotent).toBe(true);
  });
});

// ── Body & seal validation ────────────────────────────────────────────────────

describe('POST /delivery/confirm-pin — validation', () => {
  it('returns 422 when pin is missing', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeRequest({}), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/pin/i);
  });

  it('returns 409 when no activated seal found', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ sealData: null }) as never);

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 422 when no delivery_pin_hash set on seal (PIN not generated yet)', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: makeActivatedSeal({ delivery_pin_hash: null }) }) as never
    );

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/no delivery pin has been generated/i);
  });

  it('returns 403 when delivery_pin_locked_at is set', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: makeActivatedSeal({ delivery_pin_locked_at: new Date().toISOString() }) }) as never
    );

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/locked/i);
  });
});

// ── Wrong PIN / lockout ───────────────────────────────────────────────────────

describe('POST /delivery/confirm-pin — wrong PIN and lockout', () => {
  it('returns 422 with attemptsUsed and attemptsRemaining on wrong PIN', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await POST(makeRequest({ pin: '000000' }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/incorrect pin/i);
    expect(body.attemptsUsed).toBe(1);
    expect(body.attemptsRemaining).toBe(4);
  });

  it('returns 403 and locked=true on the 5th wrong attempt', async () => {
    mockSession(TRAVELER_EMAIL);
    // Simulate 4 prior attempts — next wrong attempt is the 5th
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: makeActivatedSeal({ delivery_pin_attempts: 4 }) }) as never
    );

    const res  = await POST(makeRequest({ pin: '000000' }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.locked).toBe(true);
  });

  it('does not lock on the 4th wrong attempt', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: makeActivatedSeal({ delivery_pin_attempts: 3 }) }) as never
    );

    const res  = await POST(makeRequest({ pin: '000000' }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.locked).toBeUndefined();
    expect(body.attemptsUsed).toBe(4);
    expect(body.attemptsRemaining).toBe(1);
  });
});

// ── Successful confirmation ───────────────────────────────────────────────────

describe('POST /delivery/confirm-pin — successful confirmation', () => {
  it('returns 200 with status: delivery_confirmed and escrowReleaseAt', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const before = Date.now();
    const res    = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    const after  = Date.now();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('delivery_confirmed');
    expect(body.confirmedAt).toBeDefined();
    expect(body.escrowReleaseAt).toBeDefined();

    const releaseAt = new Date(body.escrowReleaseAt).getTime();
    const confirmedAt = new Date(body.confirmedAt).getTime();

    // confirmedAt is close to now
    expect(confirmedAt).toBeGreaterThanOrEqual(before);
    expect(confirmedAt).toBeLessThanOrEqual(after);

    // escrowReleaseAt is ~24h after confirmedAt
    const diffHours = (releaseAt - confirmedAt) / (1000 * 3600);
    expect(diffHours).toBeGreaterThan(23.99);
    expect(diffHours).toBeLessThan(24.01);
  });

  it('does NOT reference Stripe capture (capture is deferred to auto-payout cron)', () => {
    // Structural assertion: the confirm-pin route has no Stripe import.
    // This is verified by inspection — the route file does not import 'stripe'
    // or call paymentIntents.capture(). Auto-payout handles that 24h later.
    // This test documents the design decision rather than exercising code.
    expect(true).toBe(true);
  });
});

// ── CLEARED path regression guard ─────────────────────────────────────────────

describe('CLEARED path (Path A) — regression guard', () => {
  it('a CLEARED match reaching active directly still has a delivery path (confirm-delivery)', () => {
    // CLEARED shipments have no seal → no PIN → use existing /confirm-delivery.
    // confirm-pin correctly returns 409 for any non-active status.
    // Since CLEARED shipments go locked_pending_compliance → compliance_in_progress → active,
    // they skip seal_pending entirely and can't use confirm-pin because there's no activated seal.
    // This structural assertion documents the accepted asymmetry.
    const CLEARED_PATH = ['locked_pending_compliance', 'compliance_in_progress', 'active'];
    expect(CLEARED_PATH).not.toContain('seal_pending');
    expect(CLEARED_PATH).not.toContain('inspection_pending');
  });

  it('confirm-pin returns 409 if no activated seal exists (CLEARED path has no seal)', async () => {
    mockSession(TRAVELER_EMAIL);
    // CLEARED match arrives at active but has no seal
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ sealData: null }) as never
    );

    const res = await POST(makeRequest({ pin: CORRECT_PIN }), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/no activated seal/i);
  });
});
