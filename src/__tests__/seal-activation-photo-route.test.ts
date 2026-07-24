/**
 * Route-level tests for POST /api/matches/[id]/seal/activation-photo
 *
 * Covers: auth, role gate (traveller-only), status gate (seal_pending only),
 * file validation (type, size), successful upload, missing file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers',         () => ({ cookies: vi.fn() }));
vi.mock('@/lib/auth/session',   () => ({ getAppSession: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: vi.fn() }));

import { POST } from '@/app/api/matches/[id]/seal/activation-photo/route';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MATCH_ID       = 'match-photo-001';
const SENDER_EMAIL   = 'sender@example.com';
const TRAVELER_EMAIL = 'traveler@example.com';

const SEAL_PENDING_MATCH = {
  sender_email:   SENDER_EMAIL,
  traveler_email: TRAVELER_EMAIL,
  status:         'seal_pending',
};

function mockSession(email: string) {
  vi.mocked(cookies).mockResolvedValue({} as never);
  vi.mocked(getAppSession).mockReturnValue({ email } as ReturnType<typeof getAppSession>);
}

function makeChain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'maybeSingle', 'update']) c[m] = vi.fn().mockReturnValue(c);
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: result });
  return c;
}

function makeSupabase(matchData: unknown = SEAL_PENDING_MATCH, uploadErr: unknown = null) {
  const storageChain = {
    upload: vi.fn().mockResolvedValue({ error: uploadErr }),
  };
  return {
    from:    vi.fn().mockReturnValue(makeChain(matchData)),
    storage: { from: vi.fn().mockReturnValue(storageChain) },
  };
}

function makeFormDataRequest(file: File | null): NextRequest {
  const form = new FormData();
  if (file) form.append('file', file);
  return new NextRequest(
    `http://localhost/api/matches/${MATCH_ID}/seal/activation-photo`,
    { method: 'POST', body: form }
  );
}

function makeJpegFile(sizeBytes = 1024): File {
  const buf = new Uint8Array(sizeBytes);
  return new File([buf], 'seal.jpg', { type: 'image/jpeg' });
}

beforeEach(() => vi.clearAllMocks());

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('POST /seal/activation-photo — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as never);
    vi.mocked(getAppSession).mockReturnValue(null);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(401);
  });
});

// ── Role gate ─────────────────────────────────────────────────────────────────

describe('POST /seal/activation-photo — role gate', () => {
  it('returns 403 when caller is the sender (not the traveller)', async () => {
    mockSession(SENDER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/carrier/i);
  });

  it('allows the traveller to upload', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });
});

// ── Status gate ───────────────────────────────────────────────────────────────

describe('POST /seal/activation-photo — status gate', () => {
  it('returns 409 when match is not seal_pending', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(
      makeSupabase({ ...SEAL_PENDING_MATCH, status: 'active' }) as never
    );

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/seal activation/i);
  });

  it('returns 404 when match does not exist', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase(null) as never);

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(404);
  });
});

// ── File validation ───────────────────────────────────────────────────────────

describe('POST /seal/activation-photo — file validation', () => {
  it('returns 400 when no file is provided', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeFormDataRequest(null), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/file is required/i);
  });

  it('returns 400 for disallowed file types (PDF)', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const pdfFile = new File([new Uint8Array(100)], 'doc.pdf', { type: 'application/pdf' });
    const res = await POST(makeFormDataRequest(pdfFile), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/jpeg|png|webp/i);
  });

  it('returns 400 for files exceeding 20 MB', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const oversized = new File([new Uint8Array(21 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const res = await POST(makeFormDataRequest(oversized), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });
});

// ── Successful upload ─────────────────────────────────────────────────────────

describe('POST /seal/activation-photo — successful upload', () => {
  it('returns 200 with ok: true and a storageKey', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const res = await POST(makeFormDataRequest(makeJpegFile()), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.storageKey).toBe('string');
    expect(body.storageKey).toContain(MATCH_ID);
  });

  it('accepts PNG files', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const png = new File([new Uint8Array(512)], 'seal.png', { type: 'image/png' });
    const res = await POST(makeFormDataRequest(png), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });

  it('accepts WebP files', async () => {
    mockSession(TRAVELER_EMAIL);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(makeSupabase() as never);

    const webp = new File([new Uint8Array(512)], 'seal.webp', { type: 'image/webp' });
    const res = await POST(makeFormDataRequest(webp), { params: Promise.resolve({ id: MATCH_ID }) });
    expect(res.status).toBe(200);
  });
});
