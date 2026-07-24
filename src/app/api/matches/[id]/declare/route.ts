/**
 * /api/matches/[id]/declare
 *
 * GET  — fetch the current item declaration for a match
 * PUT  — save/update a DRAFT declaration (no validation enforced)
 * POST — submit the declaration (full validation, becomes immutable, triggers compliance)
 *
 * Only the match sender can write. Both parties can read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';
import {
  sendComplianceApprovedEmail,
  sendComplianceRejectedEmail,
} from '@/lib/email/sendComplianceEmail';
import {
  sendInspectionRequestEmail,
  sendInspectionWaitEmail,
  sendAdminRiskAlertEmail,
} from '@/lib/email/sendInspectionEmail';
import { escalateToExternalVerification } from '@/lib/verification/escalate';
import {
  validateSubmit,
  DECLARATION_TEXT_VERSION,
} from '@/lib/declarations/validate';
import { scoreRisk } from '@/lib/risk/engine';
import { sendSMS } from '@/lib/services/telnyx';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getSession() {
  const cookieStore = await cookies();
  return getAppSession(cookieStore);
}

// ── Shared match fetch ────────────────────────────────────────────────────────
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

// ── Trigger suspended_pending_review on immutable edit attempt ────────────────
async function triggerSuspension(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  email: string,
) {
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@boothop.com';
  const from       = process.env.AUTH_FROM_EMAIL ?? 'BootHop <noreply@boothop.com>';

  await supabase.from('matches').update({ status: 'suspended_pending_review' }).eq('id', matchId);
  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: declId,
    event_type:     'SHIPMENT_SUSPENDED',
    performed_by:   email,
    metadata:       { reason: 'immutable_declaration_edit_attempt' },
  });
  sendResendEmail({
    from,
    to:      adminEmail,
    subject: `[SUSPENDED] Declaration edit on immutable — match ${matchId}`,
    html:    `<p><strong>${email}</strong> attempted to edit a submitted (immutable) declaration on match <code>${matchId}</code>. The shipment has been auto-suspended pending review.</p><p><a href="${appUrl}/admin/compliance/${matchId}">Review in admin hub →</a></p>`,
    text:    `${email} attempted to edit a submitted declaration on match ${matchId}. Auto-suspended.`,
  }).catch(() => {});
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

  const { data: evidenceRows } = await supabase
    .from('declaration_evidence')
    .select('id, evidence_type, storage_key, mime_type, created_at')
    .eq('declaration_id', match.declaration_id)
    .order('created_at', { ascending: true });

  // Generate fresh signed URLs for each file (private bucket)
  const evidence = await Promise.all(
    (evidenceRows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from('declaration-evidence')
        .createSignedUrl(row.storage_key, 60 * 60); // 1 hour
      return { ...row, file_url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ declaration: decl, evidence, matchStatus: match.status });
}

// ── PUT — save draft (no validation, partial fields OK) ───────────────────────
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
    return NextResponse.json({ error: 'Only the sender can save a declaration' }, { status: 403 });
  }
  if (!['locked_pending_compliance'].includes(match.status)) {
    return NextResponse.json({ error: `Cannot edit declaration when match status is '${match.status}'` }, { status: 409 });
  }

  const body = await request.json();
  const nowIso = new Date().toISOString();
  const fields = pickDeclFields(body);

  if (match.declaration_id) {
    const { data: existing } = await supabase
      .from('item_declarations')
      .select('declaration_status, version')
      .eq('id', match.declaration_id)
      .maybeSingle();

    if (existing?.declaration_status !== 'draft') {
      // Immutable — edit attempt is suspicious
      await triggerSuspension(supabase, matchId, match.declaration_id, session.email);
      return NextResponse.json({
        error: 'Declaration has already been submitted and cannot be edited. This attempt has been flagged for review.',
      }, { status: 409 });
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
    .insert({
      match_id:             matchId,
      declaration_status:   'draft',
      created_by:           session.email,
      declaration_text_version: DECLARATION_TEXT_VERSION,
      ...fields,
    })
    .select()
    .single();

  await supabase.from('matches').update({ declaration_id: newDecl!.id }).eq('id', matchId);

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
    return NextResponse.json({
      error: `Match must be in locked_pending_compliance to submit a declaration (current: ${match.status})`,
    }, { status: 409 });
  }

  const body  = await request.json();
  const fields = pickDeclFields(body);
  const nowIso = new Date().toISOString();

  // Full validation before any DB write
  const validationErrors = validateSubmit(fields);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', errors: validationErrors }, { status: 422 });
  }

  let declId = match.declaration_id;

  if (declId) {
    const { data: existing } = await supabase
      .from('item_declarations')
      .select('declaration_status')
      .eq('id', declId)
      .maybeSingle();

    if (existing?.declaration_status !== 'draft') {
      await triggerSuspension(supabase, matchId, declId, session.email);
      return NextResponse.json({
        error: 'Declaration has already been submitted. This attempt has been flagged for review.',
      }, { status: 409 });
    }

    await supabase.from('item_declarations').update({
      ...fields,
      declaration_status:       'submitted',
      submitted_at:             nowIso,
      updated_at:               nowIso,
      declaration_text_version: DECLARATION_TEXT_VERSION,
    }).eq('id', declId);
  } else {
    const { data: newDecl } = await supabase
      .from('item_declarations')
      .insert({
        match_id:                 matchId,
        declaration_status:       'submitted',
        submitted_at:             nowIso,
        created_by:               session.email,
        declaration_text_version: DECLARATION_TEXT_VERSION,
        ...fields,
      })
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

  await supabase.from('shipment_events').insert([
    { match_id: matchId, declaration_id: declId, event_type: 'DECLARATION_SUBMITTED', performed_by: session.email },
    { match_id: matchId, declaration_id: declId, event_type: 'COMPLIANCE_REVIEW_STARTED', performed_by: 'ai_engine' },
  ]);

  // Risk engine assessment
  const riskResult = scoreRisk(fields);
  const trip      = (match as any).sender_trip;
  const fromCity  = Array.isArray(trip) ? trip[0]?.from_city : trip?.from_city ?? '';
  const toCity    = Array.isArray(trip) ? trip[0]?.to_city   : trip?.to_city   ?? '';

  // Persist risk assessment
  const { data: riskAssessment } = await supabase
    .from('shipment_risk_assessments')
    .insert({
      match_id:            matchId,
      declaration_id:      declId,
      risk_score:          riskResult.score,
      risk_classification: riskResult.classification,
      flags:               riskResult.flags,
      breakdown:           riskResult.breakdown,
    })
    .select('id')
    .single();

  await supabase.from('item_declarations').update({
    risk_score:          riskResult.score,
    risk_classification: riskResult.classification,
    risk_assessed_at:    nowIso,
  }).eq('id', declId);

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: declId,
    event_type:     'RISK_ASSESSMENT_COMPLETED',
    performed_by:   'risk_engine',
    metadata:       { score: riskResult.score, classification: riskResult.classification, flags: riskResult.flags },
  });

  if (riskResult.classification === 'REJECTED') {
    await handleReject(supabase, matchId, declId, match, riskResult.reason ?? 'Prohibited item declared', 'risk_engine', riskResult.score, nowIso, fromCity, toCity);
    return NextResponse.json({ status: 'rejected', reason: riskResult.reason });
  }

  if (riskResult.classification === 'EXTERNAL_VERIFICATION_REQUIRED') {
    await escalateToExternalVerification(supabase, {
      matchId, declarationId: declId,
      senderEmail: match.sender_email, travelerEmail: match.traveler_email,
      fromCity, toCity,
      reason:    riskResult.reason ?? riskResult.flags.join(', '),
      source:    'risk_engine',
      riskScore: riskResult.score,
      flags:     riskResult.flags,
      nowIso,
    });
    return NextResponse.json({ status: 'external_verification_required' });
  }

  if (riskResult.classification === 'CLEARED') {
    // Low risk — approve immediately, skip inspection
    await handleApprove(supabase, matchId, declId, match, riskResult.score, nowIso, fromCity, toCity);
    return NextResponse.json({ status: 'cleared' });
  }

  if (riskResult.classification === 'STANDARD_REVIEW') {
    // Auto-advance to inspection_pending — no admin click needed
    await handleInspectionPending(supabase, matchId, declId, match, riskAssessment?.id ?? null, riskResult.score, nowIso, fromCity, toCity);
    return NextResponse.json({ status: 'standard_review' });
  }

  // MANUAL_REVIEW — stay in compliance_in_progress, alert admin with email + SMS
  const adminPhone = process.env.ADMIN_PHONE;
  await Promise.allSettled([
    sendAdminRiskAlertEmail({
      matchId,
      fromCity,
      toCity,
      senderEmail:    match.sender_email,
      itemName:       (fields.item_name as string) ?? '',
      itemCategory:   (fields.item_category as string) ?? '',
      riskScore:      riskResult.score,
      classification: riskResult.classification,
      flags:          riskResult.flags,
      breakdown:      riskResult.breakdown,
    }),
    adminPhone && sendSMS(
      adminPhone,
      `[BOOTHOP MANUAL_REVIEW] ${fromCity}→${toCity} Risk ${riskResult.score}/100 Flags:${riskResult.flags.join(',')} Match:${matchId}`
    ).catch(() => {}),
  ]);

  return NextResponse.json({ status: 'under_review' });
}

// ── Handle approve (CLEARED — low risk, skip inspection, go active) ───────────
async function handleApprove(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  match: any,
  riskScore: number,
  nowIso: string,
  fromCity: string,
  toCity: string,
) {
  await supabase.from('item_declarations').update({
    declaration_status: 'approved',
    reviewed_at:        nowIso,
    reviewed_by:        'risk_engine',
    risk_score:         riskScore,
  }).eq('id', declId);

  await supabase.from('matches').update({ status: 'active', sealed_at: nowIso }).eq('id', matchId);

  await supabase.from('shipment_events').insert([
    { match_id: matchId, declaration_id: declId, event_type: 'COMPLIANCE_APPROVED', performed_by: 'risk_engine', metadata: { risk_score: riskScore, classification: 'CLEARED' } },
    { match_id: matchId, declaration_id: declId, event_type: 'SHIPMENT_SEALED', performed_by: 'system' },
  ]);

  const trip       = (match as any).sender_trip;
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

// ── Handle inspection pending (STANDARD_REVIEW — auto-unlock inspection) ──────
async function handleInspectionPending(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  match: any,
  riskAssessmentId: string | null,
  riskScore: number,
  nowIso: string,
  fromCity: string,
  toCity: string,
) {
  await supabase.from('item_declarations').update({
    declaration_status: 'approved',
    reviewed_at:        nowIso,
    reviewed_by:        'risk_engine',
    risk_score:         riskScore,
  }).eq('id', declId);

  await supabase.from('matches').update({
    status:               'inspection_pending',
    inspection_pending_at: nowIso,
  }).eq('id', matchId);

  // Pre-create the inspection record (traveller will fill it in)
  const trip = (match as any).sender_trip;
  const { data: decl } = await supabase
    .from('item_declarations')
    .select('item_name')
    .eq('id', declId)
    .maybeSingle();

  await supabase.from('shipment_inspections').insert({
    match_id:           matchId,
    declaration_id:     declId,
    risk_assessment_id: riskAssessmentId,
    inspector_email:    match.traveler_email,
    status:             'pending',
  });

  await supabase.from('shipment_events').insert([
    { match_id: matchId, declaration_id: declId, event_type: 'COMPLIANCE_APPROVED', performed_by: 'risk_engine', metadata: { risk_score: riskScore, classification: 'STANDARD_REVIEW' } },
    { match_id: matchId, declaration_id: declId, event_type: 'INSPECTION_UNLOCKED', performed_by: 'risk_engine', metadata: { auto: true } },
  ]);

  const itemName   = decl?.item_name ?? 'Item';
  const travelDate = Array.isArray(trip) ? trip[0]?.travel_date : trip?.travel_date ?? '';

  await Promise.allSettled([
    match.traveler_email && sendInspectionRequestEmail({
      toEmail:     match.traveler_email,
      fromCity,
      toCity,
      matchId,
      itemName,
      senderEmail: match.sender_email,
    }),
    match.sender_email && sendInspectionWaitEmail({
      toEmail: match.sender_email, fromCity, toCity, matchId,
    }),
  ]);
}

// ── Handle reject ─────────────────────────────────────────────────────────────
async function handleReject(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  matchId: string,
  declId: string,
  match: any,
  reason: string,
  reviewedBy: string,
  riskScore: number,
  nowIso: string,
  fromCity: string,
  toCity: string,
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

  await Promise.allSettled([
    match.sender_email && sendComplianceRejectedEmail({
      toEmail: match.sender_email, fromCity, toCity, matchId, reason, role: 'sender',
    }),
    match.traveler_email && sendComplianceRejectedEmail({
      toEmail: match.traveler_email, fromCity, toCity, matchId, reason, role: 'traveler',
    }),
  ]);
}

// ── Allowed declaration fields (draft + submit) ───────────────────────────────
function pickDeclFields(body: Record<string, unknown>) {
  const allowed = [
    // Stage 1 fields
    'item_description', 'item_category', 'declared_value', 'declared_currency',
    'declared_weight_kg', 'contains_electronics', 'contains_medication', 'contains_food',
    'contains_liquids', 'contains_currency', 'contains_jewellery', 'contains_documents',
    'contains_clothing', 'contains_hazardous', 'contains_weapons', 'proof_of_ownership_url',
    // Stage 2 fields
    'item_name', 'quantity', 'brand', 'country_of_origin',
    'contains_battery', 'contains_powder', 'contains_chemical', 'contains_plant_or_animal',
    'item_modified', 'sender_owns_item', 'proof_of_ownership_explanation',
    'ack_description_accurate', 'ack_nothing_concealed', 'ack_complies_with_laws',
    'ack_may_be_reported', 'ack_false_decl_consequences', 'ack_legally_responsible',
  ] as const;
  return Object.fromEntries(
    allowed.filter(k => k in body).map(k => [k, body[k]])
  );
}
