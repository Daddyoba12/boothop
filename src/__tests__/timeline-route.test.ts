/**
 * Route-level tests for GET /api/matches/[id]/timeline
 *
 * Covers: auth, 404, 403 non-participant, sender/traveller access, response
 * shape (no leaking raw event_type / metadata / other parties' emails), actor
 * label ("You" vs "BootHop"), known-label mapping, unmapped fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',   () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));

import { GET } from '@/app/api/matches/[id]/timeline/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-tl-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

const MATCH = {
  id:             MATCH_ID,
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
};

const EVENTS = [
  {
    id:           'ev-1',
    event_type:   'SHIPMENT_LOCKED',
    performed_by: 'system',
    created_at:   '2026-07-01T10:00:00Z',
  },
  {
    id:           'ev-2',
    event_type:   'DECLARATION_SUBMITTED',
    performed_by: SENDER_EMAIL,
    created_at:   '2026-07-01T11:00:00Z',
  },
  {
    id:           'ev-3',
    event_type:   'COMPLIANCE_APPROVED',
    performed_by: 'admin@boothop.com',
    created_at:   '2026-07-01T12:00:00Z',
  },
  {
    id:           'ev-4',
    event_type:   'RISK_ASSESSMENT_COMPLETED', // intentionally unmapped
    performed_by: 'system',
    created_at:   '2026-07-01T13:00:00Z',
  },
];

function makeMatchChain(data: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) c[m] = vi.fn().mockReturnValue(c);
  c.maybeSingle = vi.fn().mockResolvedValue({ data });
  return c;
}

function makeEventsChain(data: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) c[m] = vi.fn().mockReturnValue(c);
  c.order = vi.fn().mockResolvedValue({ data, error: null });
  return c;
}

function makeSupabase({
  matchData  = MATCH  as unknown,
  eventsData = EVENTS as unknown,
} = {}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches')         return makeMatchChain(matchData);
      if (table === 'shipment_events') return makeEventsChain(eventsData);
      return makeMatchChain(null);
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
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/timeline`, { method: 'GET' });
}

beforeEach(() => vi.clearAllMocks());

// ── Authorization ─────────────────────────────────────────────────────────────

describe('GET /timeline — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSession(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when match not found', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ matchData: null }) as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });

  it('returns 403 when a non-participant calls', async () => {
    mockSession('stranger@example.com');
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/access denied/i);
  });

  it('sender receives 200 and their events', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
  });

  it('traveller receives 200 and their events', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
  });
});

// ── Response shape — sensitive data exclusions ────────────────────────────────

describe('GET /timeline — sensitive data must not appear in response', () => {
  it('does not include raw event_type in any event', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    for (const ev of body.events) {
      expect(ev).not.toHaveProperty('event_type');
    }
  });

  it('does not include raw metadata in any event', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    for (const ev of body.events) {
      expect(ev).not.toHaveProperty('metadata');
    }
  });

  it('does not expose the performed_by email of other parties', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    for (const ev of body.events) {
      expect(ev).not.toHaveProperty('performed_by');
      // actor must not be a raw email
      expect(ev.actor).not.toMatch(/@/);
    }
  });

  it('each event has exactly the expected safe fields', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    for (const ev of body.events) {
      expect(Object.keys(ev).sort()).toEqual(['actor', 'description', 'id', 'label', 'timestamp']);
    }
  });
});

// ── Actor label ───────────────────────────────────────────────────────────────

describe('GET /timeline — actor labelling', () => {
  it('shows "You" when performed_by matches the authenticated user', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    // ev-2 was performed by SENDER_EMAIL; that user is logged in
    const senderEvent = body.events.find((e: { id: string }) => e.id === 'ev-2');
    expect(senderEvent.actor).toBe('You');
  });

  it('shows "BootHop" for system events', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    const systemEvent = body.events.find((e: { id: string }) => e.id === 'ev-1');
    expect(systemEvent.actor).toBe('BootHop');
  });

  it('shows "BootHop" for admin email events (no admin identity leakage)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    const adminEvent = body.events.find((e: { id: string }) => e.id === 'ev-3');
    expect(adminEvent.actor).toBe('BootHop');
  });
});

// ── Label mapping ─────────────────────────────────────────────────────────────

describe('GET /timeline — label mapping', () => {
  it('maps known event_type to a specific user-facing label (not the fallback)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    const locked = body.events.find((e: { id: string }) => e.id === 'ev-1');
    expect(locked.label).toBe('Payment secured');
    expect(locked.description).not.toBe('Your shipment status was updated.');
  });

  it('falls back to "Status updated" for an unmapped event_type', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    const body = await res.json();

    // ev-4 is RISK_ASSESSMENT_COMPLETED — intentionally not in the allow-list
    const fallbackEvent = body.events.find((e: { id: string }) => e.id === 'ev-4');
    expect(fallbackEvent.label).toBe('Status updated');
    expect(fallbackEvent.description).toBe('Your shipment status was updated.');
  });

  it('returns an empty events array when there are no events', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ eventsData: [] }) as never
    );

    const res  = await GET(makeRequest(), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toEqual([]);
  });
});
