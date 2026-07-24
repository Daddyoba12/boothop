/**
 * /api/matches/[id]/inspection
 *
 * GET  — fetch inspection state + declaration summary for the inspection page
 * POST — traveller submits the handover inspection checklist
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendSealPendingEmail } from '@/lib/email/sendSealEmail';
import { sendAdminInspectionFailedEmail } from '@/lib/email/sendInspectionEmail';
import { sendSMS } from '@/lib/services/telnyx';
import { sendPushToEmail } from '@/lib/services/notifications';
import { escalateToExternalVerification } from '@/lib/verification/escalate';

async function getSession() {
  const cookieStore = await cookies();
  return getAppSession(cookieStore);
}

// ── GET — load inspection state and declaration details ───────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email,
      declaration_id, inspection_pending_at,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email && match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { data: declaration } = match.declaration_id
    ? await supabase
        .from('item_declarations')
        .select(`
          item_name, item_category, item_description, brand, quantity,
          declared_value, declared_currency, declared_weight_kg,
          country_of_origin, sender_owns_item, proof_of_ownership_url,
          proof_of_ownership_explanation, risk_classification, risk_score
        `)
        .eq('id', match.declaration_id)
        .maybeSingle()
    : { data: null };

  // Evidence with signed URLs
  const { data: evidenceRows } = match.declaration_id
    ? await supabase
        .from('declaration_evidence')
        .select('id, evidence_type, storage_key, mime_type, created_at')
        .eq('declaration_id', match.declaration_id)
        .order('created_at', { ascending: true })
    : { data: [] };

  const evidence = await Promise.all(
    (evidenceRows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from('declaration-evidence')
        .createSignedUrl(row.storage_key, 60 * 60);
      return { ...row, file_url: signed?.signedUrl ?? null };
    })
  );

  const { data: inspection } = await supabase
    .from('shipment_inspections')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ match, declaration, evidence, inspection });
}

// ── POST — submit inspection checklist ────────────────────────────────────────

const VALID_FAILURE_REASONS = [
  'mismatch_found',
  'unable_to_inspect',
  'unsure_of_contents',
  'prohibited_or_suspicious',
  'sender_refused_inspection',
] as const;

type FailureReason = (typeof VALID_FAILURE_REASONS)[number];

const AUTO_ESCALATE_REASONS: ReadonlyArray<FailureReason> = [
  'sender_refused_inspection',
  'prohibited_or_suspicious',
];

interface InspectionBody {
  check_item_matches_description: boolean;
  check_no_prohibited_items:      boolean;
  check_packaging_acceptable:     boolean;
  check_weight_reasonable:        boolean;
  check_evidence_verified:        boolean;
  inspector_note?:                string;
  failure_reason?:                string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, agreed_price, declaration_id,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Only the carrier can submit the inspection' }, { status: 403 });
  }
  if (match.status === 'external_verification_required') {
    return NextResponse.json({ error: 'This shipment requires external verification before inspection can proceed. Contact BootHop support.' }, { status: 409 });
  }
  if (match.status !== 'inspection_pending') {
    return NextResponse.json({ error: `Match must be in inspection_pending (current: ${match.status})` }, { status: 409 });
  }

  const body: InspectionBody = await request.json();
  const {
    check_item_matches_description,
    check_no_prohibited_items,
    check_packaging_acceptable,
    check_weight_reasonable,
    check_evidence_verified,
    inspector_note,
    failure_reason,
  } = body;

  // All 5 checks must be explicitly provided
  const provided = [
    check_item_matches_description, check_no_prohibited_items,
    check_packaging_acceptable, check_weight_reasonable, check_evidence_verified,
  ];
  if (provided.some(v => typeof v !== 'boolean')) {
    return NextResponse.json({ error: 'All 5 checklist items must be answered (true or false)' }, { status: 422 });
  }

  const overall_pass = provided.every(Boolean);
  if (!overall_pass && !inspector_note?.trim()) {
    return NextResponse.json({ error: 'A note is required when any check fails' }, { status: 422 });
  }
  if (!overall_pass && (!failure_reason || !VALID_FAILURE_REASONS.includes(failure_reason as FailureReason))) {
    return NextResponse.json({
      error: `failure_reason is required when any check fails. Must be one of: ${VALID_FAILURE_REASONS.join(', ')}`,
    }, { status: 422 });
  }

  const nowIso    = new Date().toISOString();
  const trip      = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : (match.sender_trip as any);
  const fromCity  = trip?.from_city  ?? '';
  const toCity    = trip?.to_city    ?? '';
  const travelDate = trip?.travel_date ?? '';

  // Upsert inspection record
  const { data: existingInspection } = await supabase
    .from('shipment_inspections')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  const validFailureReason = overall_pass ? null : (failure_reason as FailureReason);

  if (existingInspection) {
    await supabase.from('shipment_inspections').update({
      started_at:                    nowIso,
      completed_at:                  nowIso,
      check_item_matches_description,
      check_no_prohibited_items,
      check_packaging_acceptable,
      check_weight_reasonable,
      check_evidence_verified,
      overall_pass,
      inspector_note:   inspector_note?.trim() ?? null,
      failure_reason:   validFailureReason,
      status:           overall_pass ? 'passed' : 'failed',
      updated_at:       nowIso,
    }).eq('id', existingInspection.id);
  } else {
    await supabase.from('shipment_inspections').insert({
      match_id:                      matchId,
      declaration_id:                match.declaration_id,
      inspector_email:               session.email,
      started_at:                    nowIso,
      completed_at:                  nowIso,
      check_item_matches_description,
      check_no_prohibited_items,
      check_packaging_acceptable,
      check_weight_reasonable,
      check_evidence_verified,
      overall_pass,
      inspector_note:   inspector_note?.trim() ?? null,
      failure_reason:   validFailureReason,
      status:           overall_pass ? 'passed' : 'failed',
    });
  }

  if (overall_pass) {
    // Inspection passed → move to seal_pending (seal must be applied before going active)
    // sealed_at is set at seal activation, not here
    await supabase.from('matches').update({
      status: 'seal_pending',
    }).eq('id', matchId);

    if (match.declaration_id) {
      await supabase.from('item_declarations').update({
        reviewed_at: nowIso,
        reviewed_by: session.email,
      }).eq('id', match.declaration_id);
    }

    // Only INSPECTION_PASSED — SHIPMENT_SEALED is written at seal activation
    await supabase.from('shipment_events').insert({
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'INSPECTION_PASSED',
      performed_by:   session.email,
      metadata:       { inspector: session.email },
    });

    await Promise.allSettled([
      match.sender_email && sendSealPendingEmail({
        toEmail: match.sender_email, fromCity, toCity, matchId, role: 'sender',
      }),
      match.traveler_email && sendSealPendingEmail({
        toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler',
      }),
      sendPushToEmail(supabase, match.sender_email, {
        title: 'Inspection passed ✅',
        body:  `Your ${fromCity} → ${toCity} shipment passed inspection. Waiting for the carrier to apply the SecureSeal.`,
        url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
      }),
      sendPushToEmail(supabase, match.traveler_email, {
        title: 'Inspection passed ✅',
        body:  `Generate the SecureSeal and apply it to the ${fromCity} → ${toCity} package to complete activation.`,
        url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
      }),
    ]);

    return NextResponse.json({ ok: true, result: 'passed', status: 'seal_pending' });
  }

  // Write INSPECTION_FAILED event for all failure reasons (before branching)
  const failedCheckNames = provided.map((v, i) =>
    !v ? ['item_matches_description','no_prohibited_items','packaging_acceptable','weight_reasonable','evidence_verified'][i] : null
  ).filter(Boolean);

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: match.declaration_id,
    event_type:     'INSPECTION_FAILED',
    performed_by:   session.email,
    metadata:       {
      failure_reason:   validFailureReason,
      failed_checks:    failedCheckNames,
      note:             inspector_note?.trim() ?? null,
      auto_escalated:   AUTO_ESCALATE_REASONS.includes(validFailureReason as FailureReason),
    },
  });

  // Auto-escalate: sender_refused_inspection or prohibited_or_suspicious → external_verification_required
  if (AUTO_ESCALATE_REASONS.includes(validFailureReason as FailureReason)) {
    await escalateToExternalVerification(supabase, {
      matchId, declarationId: match.declaration_id,
      senderEmail: match.sender_email, travelerEmail: match.traveler_email,
      fromCity, toCity,
      reason:  validFailureReason!,
      source:  'inspection_failure',
      nowIso,
    });
    return NextResponse.json({ ok: true, result: 'failed', status: 'external_verification_required', failure_reason: validFailureReason });
  }

  // All other failure reasons → suspended_pending_review, admin reviews manually
  await supabase.from('matches').update({ status: 'suspended_pending_review' }).eq('id', matchId);

  const failedChecks = [
    !check_item_matches_description && 'item does not match description',
    !check_no_prohibited_items      && 'suspected prohibited items',
    !check_packaging_acceptable     && 'packaging not acceptable',
    !check_weight_reasonable        && 'weight inconsistency',
    !check_evidence_verified        && 'evidence could not be verified',
  ].filter(Boolean) as string[];

  const adminPhone = process.env.ADMIN_PHONE;
  await Promise.allSettled([
    sendAdminInspectionFailedEmail({
      matchId, fromCity, toCity,
      inspectorEmail: session.email,
      failedChecks,
      inspectorNote: inspector_note?.trim() ?? null,
    }),
    adminPhone && sendSMS(
      adminPhone,
      `[BOOTHOP INSPECTION FAILED] ${fromCity}→${toCity} reason:${validFailureReason} Inspector:${session.email} Match:${matchId}`
    ).catch(() => {}),
  ]);

  return NextResponse.json({ ok: true, result: 'failed', status: 'suspended_pending_review', failure_reason: validFailureReason });
}
