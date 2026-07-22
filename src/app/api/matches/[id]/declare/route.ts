/**
 * /api/matches/[id]/declare
 *
 * GET  — fetch the current item declaration for a match
 * PUT  — save/update a DRAFT declaration (only while declaration_status = 'draft')
 * POST — submit the declaration (makes it immutable, triggers compliance check)
 *
 * Only the match sender can write. Both parties can read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { checkItemCompliance } from '@/lib/services/item-compliance';
import {
  sendComplianceApprovedEmail,
  sendComplianceRejectedEmail,
  sendAdminComplianceReviewEmail,
} from '@/lib/email/sendComplianceEmail';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getSession() {
  const cookieStore = await cookies();
  return getAppSession(cookieStore);
}

// ── Shared match fetch (email verified against participant) ───────────────────
async function getMatch(supabase: ReturnType<typeof createSupabaseAdminClient>, matchId: string, email: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, declaration_id,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.sender_email !== email && data.traveler_email !== email) return null;
  return data;
}

// ── GET — fetch declaration ───────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const match = await getMatch(supabase, matchId, session.email);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  if (!match.declaration_id) {
    return NextResponse.json({ declaration: null, matchStatus: match.status });
  }

  const { data: decl } = await supabase
    .from('item_declarations')
    .select('*')
    .eq('id', match.declaration_id)
    .maybeSingle();

  return NextResponse.json({ declaration: decl, matchStatus: match.status });
}

// ── PUT — save draft ──────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const match = await getMatch(supabase, matchId, session.email);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  if (match.sender_email !== session.email) {
    return NextResponse.json({ error: 'Only the sender can submit a declaration' }, { status: 403 });
  }
  if (!['locked_pending_compliance'].includes(match.status)) {
    return NextResponse.json({ error: `Cannot edit declaration when match status is '${match.status}'` }, { status: 409 });
  }

  const body = await request.json();
  const nowIso = new Date().toISOString();
  const fields = pickDeclFields(body);

  if (match.declaration_id) {
    // Update existing draft (immutable check)
    const { data: existing } = await supabase
      .from('item_declarations')
      .select('declaration_status, version')
      .eq('id', match.declaration_id)
      .maybeSingle();

    if (existing?.declaration_status !== 'draft') {
      return NextResponse.json({ error: 'Declaration has already been submitted and cannot be edited' }, { status: 409 });
    }

    const { data: updated } = await supabase
      .from('item_declarations')
      .update({ ...fields, version: (existing.version ?? 1) + 1, updated_at: nowIso })
      .eq('id', match.declaration_id)
      .select()
      .single();

    await supabase.from('shipment_events').insert({
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'DECLARATION_DRAFT_SAVED',
      performed_by:   session.email,
      metadata:       { version: updated?.version },
    });

    return NextResponse.json({ declaration: updated });
  }

  // Create new draft
  const { data: newDecl } = await supabase
    .from('item_declarations')
    .insert({ match_id: matchId, declaration_status: 'draft', ...fields })
    .select()
    .single();

  await supabase
    .from('matches')
    .update({ declaration_id: newDecl!.id })
    .eq('id', matchId);

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: newDecl!.id,
    event_type:     'DECLARATION_DRAFT_SAVED',
    performed_by:   session.email,
    metadata:       { version: 1 },
  });

  return NextResponse.json({ declaration: newDecl });
}

// ── POST — submit declaration (triggers compliance check) ─────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const match = await getMatch(supabase, matchId, session.email);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  if (match.sender_email !== session.email) {
    return NextResponse.json({ error: 'Only the sender can submit a declaration' }, { status: 403 });
  }
  if (match.status !== 'locked_pending_compliance') {
    return NextResponse.json({ error: `Match must be in locked_pending_compliance (current: ${match.status})` }, { status: 409 });
  }

  const body = await request.json();
  const fields = pickDeclFields(body);
  const nowIso = new Date().toISOString();

  let declId = match.declaration_id;

  if (declId) {
    // Verify still draft before submitting
    const { data: existing } = await supabase
      .from('item_declarations')
      .select('declaration_status')
      .eq('id', declId)
      .maybeSingle();

    if (existing?.declaration_status !== 'draft') {
      return NextResponse.json({ error: 'Declaration has already been submitted' }, { status: 409 });
    }

    await supabase
      .from('item_declarations')
      .update({ ...fields, declaration_status: 'submitted', submitted_at: nowIso, updated_at: nowIso })
      .eq('id', declId);
  } else {
    // Create and immediately submit
    const { data: newDecl } = await supabase
      .from('item_declarations')
      .insert({ match_id: matchId, declaration_status: 'submitted', submitted_at: nowIso, ...fields })
      .select()
      .single();

    declId = newDecl!.id;
    await supabase.from('matches').update({ declaration_id: declId }).eq('id', matchId);
  }

  // Advance match to compliance_in_progress
  await supabase.from('matches').update({
    status:                       'compliance_in_progress',
    compliance_review_started_at: nowIso,
  }).eq('id', matchId);

  // Write chain-of-custody events
  await supabase.from('shipment_events').insert([
    { match_id: matchId, declaration_id: declId, event_type: 'DECLARATION_SUBMITTED', performed_by: session.email },
    { match_id: matchId, declaration_id: declId, event_type: 'COMPLIANCE_REVIEW_STARTED', performed_by: 'ai_engine' },
  ]);

  // Auto compliance check
  const { decision, riskScore, flags, reason } = runAutoCheck(fields);

  if (decision === 'reject') {
    await handleReject(supabase, matchId, declId, match, reason ?? 'Prohibited item declared', 'ai_engine', riskScore, nowIso);
    return NextResponse.json({ status: 'rejected', reason });
  }

  if (decision === 'approve') {
    await handleApprove(supabase, matchId, declId, match, riskScore, nowIso);
    return NextResponse.json({ status: 'approved' });
  }

  // Needs manual review
  await supabase.from('item_declarations').update({ risk_score: riskScore }).eq('id', declId);

  const trip = (match as any).sender_trip;
  const fromCity = Array.isArray(trip) ? trip[0]?.from_city : trip?.from_city ?? '';
  const toCity   = Array.isArray(trip) ? trip[0]?.to_city   : trip?.to_city   ?? '';

  await sendAdminComplianceReviewEmail({
    matchId,
    senderEmail:     match.sender_email,
    fromCity,
    toCity,
    itemDescription: fields.item_description ?? '',
    itemCategory:    fields.item_category ?? '',
    riskScore,
    flags,
  }).catch(() => {});

  return NextResponse.json({ status: 'under_review' });
}

// ── Auto compliance check ─────────────────────────────────────────────────────
function runAutoCheck(fields: Record<string, unknown>): {
  decision: 'approve' | 'review' | 'reject';
  riskScore: number;
  flags: string[];
  reason?: string;
} {
  if (fields.contains_weapons || fields.contains_hazardous) {
    return { decision: 'reject', riskScore: 100, flags: ['prohibited item'], reason: 'Prohibited items declared' };
  }

  const reviewFlags: string[] = [];
  if (fields.contains_currency)  reviewFlags.push('currency');
  if (fields.contains_medication) reviewFlags.push('medication');
  if (fields.contains_jewellery)  reviewFlags.push('jewellery');
  if ((fields.declared_value as number ?? 0) > 1000) reviewFlags.push('high declared value');

  // Also run category-level check if category provided
  if (fields.item_category) {
    const catResult = checkItemCompliance(fields.item_category as string, 'GB', 'NG', fields.declared_value as number ?? 0);
    if (!catResult.allowed) {
      return { decision: 'reject', riskScore: 100, flags: ['prohibited category'], reason: catResult.reason };
    }
    if (catResult.action === 'review') reviewFlags.push(`category: ${fields.item_category}`);
  }

  if (reviewFlags.length > 0) {
    let riskScore = 50;
    if (fields.contains_currency)  riskScore += 20;
    if (fields.contains_medication) riskScore += 15;
    if ((fields.declared_value as number ?? 0) > 2000) riskScore += 15;
    return { decision: 'review', riskScore: Math.min(riskScore, 99), flags: reviewFlags };
  }

  let riskScore = 10;
  if (fields.contains_electronics) riskScore += 20;
  if (fields.contains_food)        riskScore += 10;
  if (fields.contains_liquids)     riskScore += 10;
  if ((fields.declared_value as number ?? 0) > 500) riskScore += 15;
  return { decision: 'approve', riskScore: Math.min(riskScore, 49), flags: [] };
}

// ── Handle approve: sealed_for_transit → active + contacts ───────────────────
async function handleApprove(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  match: any,
  riskScore: number,
  nowIso: string
) {
  await supabase.from('item_declarations').update({
    declaration_status: 'approved',
    reviewed_at:        nowIso,
    reviewed_by:        'ai_engine',
    risk_score:         riskScore,
  }).eq('id', declId);

  await supabase.from('matches').update({
    status:    'active',
    sealed_at: nowIso,
  }).eq('id', matchId);

  await supabase.from('shipment_events').insert([
    { match_id: matchId, declaration_id: declId, event_type: 'COMPLIANCE_APPROVED', performed_by: 'ai_engine', metadata: { risk_score: riskScore } },
    { match_id: matchId, declaration_id: declId, event_type: 'SHIPMENT_SEALED', performed_by: 'system' },
  ]);

  const trip       = (match as any).sender_trip;
  const fromCity   = Array.isArray(trip) ? trip[0]?.from_city   : trip?.from_city   ?? '';
  const toCity     = Array.isArray(trip) ? trip[0]?.to_city     : trip?.to_city     ?? '';
  const travelDate = Array.isArray(trip) ? trip[0]?.travel_date : trip?.travel_date ?? '';

  await Promise.allSettled([
    match.sender_email && sendComplianceApprovedEmail({
      toEmail: match.sender_email, fromCity, toCity, travelDate, matchId,
      otherEmail: match.traveler_email, role: 'sender',
    }),
    match.traveler_email && sendComplianceApprovedEmail({
      toEmail: match.traveler_email, fromCity, toCity, travelDate, matchId,
      otherEmail: match.sender_email, role: 'traveler',
    }),
  ]);
}

// ── Handle reject: compliance_rejected + refund email ────────────────────────
async function handleReject(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  match: any,
  reason: string,
  reviewedBy: string,
  riskScore: number,
  nowIso: string
) {
  await supabase.from('item_declarations').update({
    declaration_status: 'rejected',
    reviewed_at:        nowIso,
    reviewed_by:        reviewedBy,
    review_note:        reason,
    risk_score:         riskScore,
  }).eq('id', declId);

  await supabase.from('matches').update({ status: 'compliance_rejected' }).eq('id', matchId);

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: declId,
    event_type:     'COMPLIANCE_REJECTED',
    performed_by:   reviewedBy,
    metadata:       { reason, risk_score: riskScore },
  });

  const trip     = (match as any).sender_trip;
  const fromCity = Array.isArray(trip) ? trip[0]?.from_city : trip?.from_city ?? '';
  const toCity   = Array.isArray(trip) ? trip[0]?.to_city   : trip?.to_city   ?? '';

  await Promise.allSettled([
    match.sender_email && sendComplianceRejectedEmail({
      toEmail: match.sender_email, fromCity, toCity, matchId, reason, role: 'sender',
    }),
    match.traveler_email && sendComplianceRejectedEmail({
      toEmail: match.traveler_email, fromCity, toCity, matchId, reason, role: 'traveler',
    }),
  ]);
}

// ── Extract allowed declaration fields from request body ─────────────────────
function pickDeclFields(body: Record<string, unknown>) {
  const allowed = [
    'item_description', 'item_category', 'declared_value', 'declared_currency',
    'declared_weight_kg', 'contains_electronics', 'contains_medication', 'contains_food',
    'contains_liquids', 'contains_currency', 'contains_jewellery', 'contains_documents',
    'contains_clothing', 'contains_hazardous', 'contains_weapons', 'proof_of_ownership_url',
  ] as const;
  return Object.fromEntries(
    allowed.filter(k => k in body).map(k => [k, body[k]])
  );
}
