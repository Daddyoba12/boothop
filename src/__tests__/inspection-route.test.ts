/**
 * Route-level tests for POST /api/matches/[id]/inspection
 *
 * These test authorization, status gating, and input validation at the handler
 * boundary — not the risk-scoring logic (covered in risk-engine.test.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// vi.mock calls are hoisted before imports — mocks must be declared here
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/email/sendSealEmail', () => ({ sendSealPendingEmail: vi.fn().mockResolvedValue(undefined), sendSealActivatedEmail: vi.fn().mockResolvedValue(undefined), sendSealConfirmationRequestEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/email/sendInspectionEmail', () => ({ sendAdminInspectionFailedEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/services/telnyx', () => ({ sendSMS: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/services/notifications', () => ({ sendPushToEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/verification/escalate', () => ({ escalateToExternalVerification: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '@/app/api/matches/[id]/inspection/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { escalateToExternalVerification } from '@/lib/verification/escalate';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MATCH_ID = 'match-001';
const SENDER_EMAIL = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/matches/${MATCH_ID}/inspection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeChain(result: unknown, opts: { insertResult?: unknown } = {}) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'limit', 'update'];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: result });
  chain.single      = vi.fn().mockResolvedValue({ data: result });
  chain.insert      = vi.fn().mockResolvedValue({ data: opts.insertResult ?? null, error: null });
  return chain;
}

function makeSupabase(matchData: unknown) {
  const matchChain      = makeChain(matchData);
  const inspectionChain = makeChain(null); // no existing inspection record
  const eventChain      = makeChain(null);
  const declChain       = makeChain(null);
  const storageChain    = { createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' } }) };

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'matches')             return matchChain;
      if (table === 'shipment_inspections') return inspectionChain;
      if (table === 'shipment_events')      return eventChain;
      if (table === 'item_declarations')    return declChain;
      return makeChain(null);
    }),
    storage: { from: vi.fn().mockReturnValue(storageChain) },
  };
}

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as ReturnType<typeof cookies> extends Promise<infer T> ? T : never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

const VALID_MATCH = {
  id:             MATCH_ID,
  status:         'inspection_pending',
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
  agreed_price:   150,
  declaration_id: 'decl-001',
  sender_trip:    { from_city: 'London', to_city: 'Lagos', travel_date: '2026-08-01' },
};

const ALL_PASS_BODY = {
  check_item_matches_description: true,
  check_no_prohibited_items:      true,
  check_packaging_acceptable:     true,
  check_weight_reasonable:        true,
  check_evidence_verified:        true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Authorization ─────────────────────────────────────────────────────────────

describe('POST /inspection — authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when the sender (not traveller) calls the endpoint', async () => {
    mockSession(SENDER_EMAIL); // sender, not traveler
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/carrier|travell/i);
  });

  it('returns 403 for a third-party user not on the match', async () => {
    mockSession('nobody@example.com');
    const matchWithDifferentParties = { ...VALID_MATCH, sender_email: 'a@x.com', traveler_email: 'b@x.com' };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(matchWithDifferentParties) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    // The match check inside getMatch returns null for non-participants → 404
    // (route fetches match then checks traveler_email === session.email)
    // Either 403 or 404 is acceptable; the important thing is it's not 200
    expect([403, 404]).toContain(res.status);
  });
});

// ── Status gate — MANUAL_REVIEW hard gate ────────────────────────────────────

describe('POST /inspection — status gate', () => {
  it('returns 409 for a MANUAL_REVIEW match (compliance_in_progress) — direct API hit', async () => {
    mockSession(TRAVELER_EMAIL);
    const manualReviewMatch = { ...VALID_MATCH, status: 'compliance_in_progress' };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(manualReviewMatch) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/inspection_pending/);
    // Confirm the actual current status is exposed so callers know what happened
    expect(body.error).toMatch(/compliance_in_progress/);
  });

  it('returns 409 for a compliance_rejected match', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ ...VALID_MATCH, status: 'compliance_rejected' }) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 for an already-active match', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ ...VALID_MATCH, status: 'active' }) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 for a locked_pending_compliance match', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ ...VALID_MATCH, status: 'locked_pending_compliance' }) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
  });

  it('returns 409 when match is in external_verification_required', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase({ ...VALID_MATCH, status: 'external_verification_required' }) as never);

    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/external verification/i);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('POST /inspection — input validation', () => {
  beforeEach(() => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);
  });

  it('returns 422 when any checklist boolean is missing', async () => {
    const body = { ...ALL_PASS_BODY };
    delete (body as Record<string, unknown>).check_evidence_verified;

    const res = await POST(makeRequest(body), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/5|answered/i);
  });

  it('returns 422 when a checklist value is a string rather than a boolean', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_evidence_verified: 'yes' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(422);
  });

  it('returns 422 when a check fails and no note is provided', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_no_prohibited_items: false }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/note/i);
  });

  it('returns 422 when a check fails and note is whitespace-only', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_packaging_acceptable: false, inspector_note: '   ' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(422);
  });

  it('accepts a failing check when note and failure_reason are provided', async () => {
    const res = await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_weight_reasonable: false,
        inspector_note: 'Package was significantly heavier than declared',
        failure_reason: 'mismatch_found',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    // Should not be a 422 — will be 200 (failed result)
    expect(res.status).not.toBe(422);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(409);
  });
});

// ── Outcome shape ─────────────────────────────────────────────────────────────

describe('POST /inspection — response shape', () => {
  beforeEach(() => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);
  });

  it('all-pass returns { ok: true, result: "passed", status: "seal_pending" }', async () => {
    const res = await POST(makeRequest(ALL_PASS_BODY), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result).toBe('passed');
    expect(json.status).toBe('seal_pending');
  });

  it('one-fail returns { ok: true, result: "failed", status: "suspended_pending_review", failure_reason }', async () => {
    const res = await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_item_matches_description: false,
        inspector_note: 'Contents differ from description',
        failure_reason: 'mismatch_found',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result).toBe('failed');
    expect(json.status).toBe('suspended_pending_review');
    expect(json.failure_reason).toBe('mismatch_found');
  });
});

// ── Stage 3.5: failure_reason validation ──────────────────────────────────────

describe('POST /inspection — failure_reason validation (Stage 3.5)', () => {
  beforeEach(() => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);
  });

  it('returns 422 when a check fails and failure_reason is missing', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_no_prohibited_items: false, inspector_note: 'Suspicious contents' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/failure_reason/i);
  });

  it('returns 422 when failure_reason is not a valid enum value', async () => {
    const res = await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_no_prohibited_items: false,
        inspector_note: 'Suspicious contents',
        failure_reason: 'made_up_reason',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/failure_reason/i);
  });

  it('passes validation and returns suspended_pending_review for failure_reason mismatch_found', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_item_matches_description: false, inspector_note: 'Item differs', failure_reason: 'mismatch_found' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('suspended_pending_review');
    expect(json.failure_reason).toBe('mismatch_found');
  });

  it('passes validation and returns suspended_pending_review for failure_reason unable_to_inspect', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_evidence_verified: false, inspector_note: 'Could not open package', failure_reason: 'unable_to_inspect' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('suspended_pending_review');
    expect(json.failure_reason).toBe('unable_to_inspect');
  });

  it('passes validation and returns suspended_pending_review for failure_reason unsure_of_contents', async () => {
    const res = await POST(
      makeRequest({ ...ALL_PASS_BODY, check_no_prohibited_items: false, inspector_note: 'Contents unclear', failure_reason: 'unsure_of_contents' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('suspended_pending_review');
    expect(json.failure_reason).toBe('unsure_of_contents');
  });
});

// ── Stage 3.5: auto-escalation ────────────────────────────────────────────────

describe('POST /inspection — auto-escalation (Stage 3.5)', () => {
  beforeEach(() => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(VALID_MATCH) as never);
    vi.mocked(escalateToExternalVerification).mockClear();
  });

  it('sender_refused_inspection → calls escalateToExternalVerification and returns external_verification_required', async () => {
    const res = await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_item_matches_description: false,
        inspector_note: 'Sender refused to open the package',
        failure_reason: 'sender_refused_inspection',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe('failed');
    expect(json.status).toBe('external_verification_required');
    expect(json.failure_reason).toBe('sender_refused_inspection');
    expect(vi.mocked(escalateToExternalVerification)).toHaveBeenCalledOnce();
    const callArg = vi.mocked(escalateToExternalVerification).mock.calls[0][1];
    expect(callArg.source).toBe('inspection_failure');
    expect(callArg.reason).toBe('sender_refused_inspection');
    expect(callArg.matchId).toBe(MATCH_ID);
  });

  it('prohibited_or_suspicious → calls escalateToExternalVerification and returns external_verification_required', async () => {
    const res = await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_no_prohibited_items: false,
        inspector_note: 'Item appeared to be a prohibited substance',
        failure_reason: 'prohibited_or_suspicious',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe('failed');
    expect(json.status).toBe('external_verification_required');
    expect(json.failure_reason).toBe('prohibited_or_suspicious');
    expect(vi.mocked(escalateToExternalVerification)).toHaveBeenCalledOnce();
    const callArg = vi.mocked(escalateToExternalVerification).mock.calls[0][1];
    expect(callArg.source).toBe('inspection_failure');
  });

  it('mismatch_found does NOT call escalateToExternalVerification', async () => {
    await POST(
      makeRequest({ ...ALL_PASS_BODY, check_packaging_acceptable: false, inspector_note: 'Weight mismatch', failure_reason: 'mismatch_found' }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    expect(vi.mocked(escalateToExternalVerification)).not.toHaveBeenCalled();
  });

  it('escalation call passes source: "inspection_failure" (distinguishable from risk_engine or admin_escalation)', async () => {
    await POST(
      makeRequest({
        ...ALL_PASS_BODY,
        check_no_prohibited_items: false,
        inspector_note: 'Refused access',
        failure_reason: 'sender_refused_inspection',
      }),
      { params: Promise.resolve({ id: MATCH_ID }) }
    );
    const callArg = vi.mocked(escalateToExternalVerification).mock.calls[0][1];
    expect(callArg.source).toBe('inspection_failure');
    expect(callArg.source).not.toBe('risk_engine');
    expect(callArg.source).not.toBe('admin_escalation');
  });
});
