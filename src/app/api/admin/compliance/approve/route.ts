/**
 * POST /api/admin/compliance/approve
 *
 * Admin approves or rejects a declaration that is in compliance_in_progress.
 * Uses session auth (requireAdminApi) so the admin's email is captured in the audit trail.
 *
 * Body: { matchId: string, decision: 'approve' | 'reject', note?: string }
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
  sendAdminExternalVerificationEmail,
  sendExternalVerificationHoldEmail,
} from '@/lib/email/sendExternalVerificationEmail';
import { sendSMS } from '@/lib/services/telnyx';

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { matchId: string; decision: 'approve' | 'reject' | 'escalate_to_verification'; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { matchId, decision, note } = body;
  if (!matchId || !decision) {
    return NextResponse.json({ error: 'matchId and decision are required' }, { status: 400 });
  }
  if (!['approve', 'reject', 'escalate_to_verification'].includes(decision)) {
    return NextResponse.json({ error: 'decision must be approve, reject, or escalate_to_verification' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select(`
      id, status, declaration_id,
      sender_email, traveler_email,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }
  if (match.status !== 'compliance_in_progress') {
    return NextResponse.json({
      error: `Match must be in compliance_in_progress (current: ${match.status})`,
    }, { status: 409 });
  }
  if (!match.declaration_id) {
    return NextResponse.json({ error: 'No declaration found for this match' }, { status: 409 });
  }

  const nowIso   = new Date().toISOString();
  const trip     = Array.isArray(match.sender_trip) ? match.sender_trip[0] : (match.sender_trip as any);
  const fromCity = trip?.from_city   ?? '';
  const toCity   = trip?.to_city     ?? '';
  const travelDate = trip?.travel_date ?? '';

  if (decision === 'escalate_to_verification') {
    const nowIso = new Date().toISOString();

    await supabase.from('matches').update({
      status:                            'external_verification_required',
      external_verification_required_at: nowIso,
    }).eq('id', matchId);

    await supabase.from('shipment_verification_requests').insert({
      match_id:      matchId,
      status:        'pending',
      reason:        note?.trim() ?? 'Admin escalation from manual review',
      requested_by:  admin.email,
      requested_at:  nowIso,
    });

    await supabase.from('shipment_events').insert({
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'EXTERNAL_VERIFICATION_REQUESTED',
      performed_by:   admin.email,
      metadata:       { source: 'admin_escalation', reason: note?.trim() ?? null },
    });

    const adminPhone = process.env.ADMIN_PHONE;
    await Promise.allSettled([
      sendAdminExternalVerificationEmail({
        matchId, fromCity, toCity,
        senderEmail:   match.sender_email,
        travelerEmail: match.traveler_email,
        riskScore:     0,
        flags:         ['admin escalation'],
        reason:        note?.trim() ?? 'Admin escalation from manual review',
        source:        'admin_escalation',
      }),
      adminPhone && sendSMS(
        adminPhone,
        `[BOOTHOP] Escalated to external verification: ${fromCity}→${toCity} by ${admin.email} Match:${matchId}`
      ).catch(() => {}),
      match.sender_email && sendExternalVerificationHoldEmail({
        toEmail: match.sender_email, fromCity, toCity, matchId, role: 'sender',
      }),
      match.traveler_email && sendExternalVerificationHoldEmail({
        toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler',
      }),
    ]);

    return NextResponse.json({ ok: true, matchId, status: 'external_verification_required', escalated_by: admin.email });
  }

  if (decision === 'approve') {
    // Fetch declaration for item name (inspection email needs it)
    const { data: decl } = await supabase
      .from('item_declarations')
      .select('item_name, risk_assessment_id:id')
      .eq('id', match.declaration_id)
      .maybeSingle();

    await supabase.from('item_declarations').update({
      declaration_status: 'approved',
      reviewed_at:        nowIso,
      reviewed_by:        admin.email,
      review_note:        note ?? null,
    }).eq('id', match.declaration_id);

    // Admin approve for MANUAL_REVIEW → inspection_pending (not active)
    await supabase.from('matches').update({
      status:                'inspection_pending',
      inspection_pending_at: nowIso,
    }).eq('id', matchId);

    // Pre-create inspection record if one doesn't exist yet
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

    await supabase.from('shipment_events').insert([
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'COMPLIANCE_APPROVED',
        performed_by:   admin.email,
        metadata:       { note: note ?? null, action: 'manual_review_approved' },
      },
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'INSPECTION_UNLOCKED',
        performed_by:   admin.email,
        metadata:       { auto: false, approved_by: admin.email },
      },
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'SHIPMENT_LOCK_OVERRIDDEN',
        performed_by:   admin.email,
        metadata:       { action: 'manual_approve_for_inspection', note: note ?? null },
      },
    ]);

    const itemName = decl?.item_name ?? 'Item';

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
      // SMS the admin number to confirm their own action
      process.env.ADMIN_PHONE && sendSMS(
        process.env.ADMIN_PHONE,
        `[BOOTHOP] Approved for inspection: ${fromCity}→${toCity} Match:${matchId}`
      ).catch(() => {}),
    ]);

    return NextResponse.json({ ok: true, matchId, status: 'inspection_pending', approved_by: admin.email });
  }

  // Reject
  await supabase.from('item_declarations').update({
    declaration_status: 'rejected',
    reviewed_at:        nowIso,
    reviewed_by:        admin.email,
    review_note:        note ?? null,
  }).eq('id', match.declaration_id);

  await supabase.from('matches').update({ status: 'compliance_rejected' }).eq('id', matchId);

  await supabase.from('shipment_events').insert([
    {
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'COMPLIANCE_REJECTED',
      performed_by:   admin.email,
      metadata:       { reason: note ?? null },
    },
    {
      match_id:       matchId,
      declaration_id: match.declaration_id,
      event_type:     'SHIPMENT_LOCK_OVERRIDDEN',
      performed_by:   admin.email,
      metadata:       { action: 'manual_reject', reason: note ?? null },
    },
  ]);

  await Promise.allSettled([
    match.sender_email && sendComplianceRejectedEmail({
      toEmail: match.sender_email, fromCity, toCity, matchId,
      reason: note, role: 'sender',
    }),
    match.traveler_email && sendComplianceRejectedEmail({
      toEmail: match.traveler_email, fromCity, toCity, matchId,
      reason: note, role: 'traveler',
    }),
  ]);

  return NextResponse.json({ ok: true, matchId, status: 'compliance_rejected', rejected_by: admin.email });
}
