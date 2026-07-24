/**
 * POST /api/admin/verification/[requestId]/result
 *
 * Admin submits the outcome of an external verification request.
 * Only callable while request is pending or in_progress.
 *
 * approved     → match advances to inspection_pending
 * rejected     → match closes (compliance_rejected), refund triggered
 * inconclusive → match stays in external_verification_required (dead-end, requires another admin action)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  sendComplianceRejectedEmail,
} from '@/lib/email/sendComplianceEmail';
import {
  sendInspectionRequestEmail,
  sendInspectionWaitEmail,
} from '@/lib/email/sendInspectionEmail';
import {
  sendAdminVerificationResultEmail,
} from '@/lib/email/sendExternalVerificationEmail';
import { sendSMS } from '@/lib/services/telnyx';

const OPEN_STATUSES = ['pending', 'in_progress'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await params;

  let body: {
    verification_result:       'approved' | 'rejected' | 'inconclusive';
    verification_reference?:   string;
    verification_document_url?: string;
    notes?:                    string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { verification_result, verification_reference, verification_document_url, notes } = body;

  if (!verification_result) {
    return NextResponse.json({ error: 'verification_result is required' }, { status: 422 });
  }
  if (!['approved', 'rejected', 'inconclusive'].includes(verification_result)) {
    return NextResponse.json({ error: 'verification_result must be approved, rejected, or inconclusive' }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: verReq } = await supabase
    .from('shipment_verification_requests')
    .select('id, match_id, status')
    .eq('id', requestId)
    .maybeSingle();

  if (!verReq) return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  if (!OPEN_STATUSES.includes(verReq.status)) {
    return NextResponse.json({
      error: `Verification request is already resolved (status: ${verReq.status}). Cannot resubmit.`,
    }, { status: 409 });
  }

  const matchId = verReq.match_id;

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, declaration_id,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.status !== 'external_verification_required') {
    return NextResponse.json({
      error: `Match must be in external_verification_required (current: ${match.status})`,
    }, { status: 409 });
  }

  const nowIso    = new Date().toISOString();
  const trip      = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : (match.sender_trip as any);
  const fromCity  = trip?.from_city  ?? '';
  const toCity    = trip?.to_city    ?? '';
  const travelDate = trip?.travel_date ?? '';

  // Update verification request
  await supabase.from('shipment_verification_requests').update({
    status:                    verification_result === 'approved' ? 'approved' : verification_result === 'rejected' ? 'rejected' : 'inconclusive',
    verification_result,
    verification_reference:    verification_reference?.trim() ?? null,
    verification_document_url: verification_document_url?.trim() ?? null,
    verified_by:               admin.email,
    verified_at:               nowIso,
    notes:                     notes?.trim() ?? null,
    updated_at:                nowIso,
  }).eq('id', requestId);

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: match.declaration_id,
    event_type:     'EXTERNAL_VERIFICATION_COMPLETED',
    performed_by:   admin.email,
    metadata:       {
      result:     verification_result,
      reference:  verification_reference ?? null,
      doc_url:    verification_document_url ?? null,
      notes:      notes ?? null,
    },
  });

  const adminPhone = process.env.ADMIN_PHONE;

  if (verification_result === 'approved') {
    // Advance to inspection_pending — same path as STANDARD_REVIEW auto-advance
    await supabase.from('matches').update({
      status:                'inspection_pending',
      inspection_pending_at: nowIso,
    }).eq('id', matchId);

    const { data: existingInspection } = await supabase
      .from('shipment_inspections')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle();

    if (!existingInspection) {
      await supabase.from('shipment_inspections').insert({
        match_id:        matchId,
        declaration_id:  match.declaration_id,
        inspector_email: match.traveler_email,
        status:          'pending',
      });
    }

    await supabase.from('shipment_events').insert({
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'INSPECTION_UNLOCKED',
      performed_by:   admin.email,
      metadata:       { auto: false, source: 'external_verification_approved', approved_by: admin.email },
    });

    const itemName = await supabase
      .from('item_declarations')
      .select('item_name')
      .eq('id', match.declaration_id)
      .maybeSingle()
      .then(r => (r.data as any)?.item_name ?? 'Item');

    await Promise.allSettled([
      sendAdminVerificationResultEmail({ matchId, fromCity, toCity, result: 'approved', reference: verification_reference ?? null, verifiedBy: admin.email, notes: notes ?? null }),
      match.traveler_email && sendInspectionRequestEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId, itemName, senderEmail: match.sender_email }),
      match.sender_email   && sendInspectionWaitEmail({ toEmail: match.sender_email, fromCity, toCity, matchId }),
      adminPhone && sendSMS(adminPhone, `[BOOTHOP] Ext verification APPROVED: ${fromCity}→${toCity} Match:${matchId} → inspection_pending`).catch(() => {}),
    ]);

    return NextResponse.json({ ok: true, matchId, status: 'inspection_pending', result: 'approved' });
  }

  if (verification_result === 'rejected') {
    await supabase.from('matches').update({ status: 'compliance_rejected' }).eq('id', matchId);

    if (match.declaration_id) {
      await supabase.from('item_declarations').update({
        declaration_status: 'rejected',
        reviewed_at:        nowIso,
        reviewed_by:        admin.email,
        review_note:        `External verification rejected: ${notes?.trim() ?? 'no reason given'}`,
      }).eq('id', match.declaration_id);
    }

    await Promise.allSettled([
      sendAdminVerificationResultEmail({ matchId, fromCity, toCity, result: 'rejected', reference: verification_reference ?? null, verifiedBy: admin.email, notes: notes ?? null }),
      match.sender_email   && sendComplianceRejectedEmail({ toEmail: match.sender_email,   fromCity, toCity, matchId, reason: `External verification rejected: ${notes?.trim() ?? ''}`, role: 'sender' }),
      match.traveler_email && sendComplianceRejectedEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId, reason: `External verification rejected: ${notes?.trim() ?? ''}`, role: 'traveler' }),
      adminPhone && sendSMS(adminPhone, `[BOOTHOP] Ext verification REJECTED: ${fromCity}→${toCity} Match:${matchId}`).catch(() => {}),
    ]);

    return NextResponse.json({ ok: true, matchId, status: 'compliance_rejected', result: 'rejected' });
  }

  // inconclusive — shipment stays in external_verification_required, no auto-advance
  await Promise.allSettled([
    sendAdminVerificationResultEmail({ matchId, fromCity, toCity, result: 'inconclusive', reference: verification_reference ?? null, verifiedBy: admin.email, notes: notes ?? null }),
    adminPhone && sendSMS(adminPhone, `[BOOTHOP] Ext verification INCONCLUSIVE: ${fromCity}→${toCity} Match:${matchId} — admin action required`).catch(() => {}),
  ]);

  return NextResponse.json({ ok: true, matchId, status: 'external_verification_required', result: 'inconclusive' });
}
