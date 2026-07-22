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
  sendComplianceApprovedEmail,
  sendComplianceRejectedEmail,
} from '@/lib/email/sendComplianceEmail';

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { matchId: string; decision: 'approve' | 'reject'; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { matchId, decision, note } = body;
  if (!matchId || !decision) {
    return NextResponse.json({ error: 'matchId and decision are required' }, { status: 400 });
  }
  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 });
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

  if (decision === 'approve') {
    await supabase.from('item_declarations').update({
      declaration_status: 'approved',
      reviewed_at:        nowIso,
      reviewed_by:        admin.email,
      review_note:        note ?? null,
    }).eq('id', match.declaration_id);

    await supabase.from('matches').update({
      status:    'active',
      sealed_at: nowIso,
    }).eq('id', matchId);

    await supabase.from('shipment_events').insert([
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'COMPLIANCE_APPROVED',
        performed_by:   admin.email,
        metadata:       { note: note ?? null },
      },
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'SHIPMENT_SEALED',
        performed_by:   'system',
        metadata:       { approved_by: admin.email },
      },
      {
        match_id:       matchId,
        declaration_id: match.declaration_id,
        event_type:     'SHIPMENT_LOCK_OVERRIDDEN',
        performed_by:   admin.email,
        metadata:       { action: 'manual_approve', note: note ?? null },
      },
    ]);

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

    return NextResponse.json({ ok: true, matchId, status: 'active', approved_by: admin.email });
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
