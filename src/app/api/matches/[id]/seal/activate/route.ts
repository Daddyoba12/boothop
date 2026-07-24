/**
 * POST /api/matches/[id]/seal/activate
 *
 * Traveller submits the SecureSeal activation: QR token, seal number cross-check,
 * activation photo storage key, and recorded weight. On success:
 *   - seal status → 'activated', traveller_confirmed_at set
 *   - match status → 'active', sealed_at set
 *   - SECURESEAL_ACTIVATED + SHIPMENT_SEALED events written
 *   - Both parties notified; sender also receives a seal-confirmation request
 *
 * Dual-confirmation approach: traveller activates (synchronous gate), sender confirms
 * via POST /api/matches/[id]/seal/confirm (non-blocking async — package is already
 * in transit). sender_confirmed_at is populated when sender taps the email link.
 * This mirrors the physical reality: both parties are co-located at handover, the
 * traveller's scan is the chain-of-custody record, the sender's explicit confirmation
 * is captured asynchronously without blocking activation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/seals/generate';
import { sendSealActivatedEmail, sendSealConfirmationRequestEmail } from '@/lib/email/sendSealEmail';
import { sendSMS } from '@/lib/services/telnyx';
import { sendPushToEmail } from '@/lib/services/notifications';

interface ActivateBody {
  token:                string; // raw QR token (never stored)
  seal_number:          string; // visible seal number for cross-check
  activation_photo_url: string; // Supabase Storage key for the activation photo
  activated_weight:     number; // package weight in kg at activation
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  // Only the traveller may activate the seal
  if (match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Only the carrier can activate the SecureSeal' }, { status: 403 });
  }

  // Match must be in seal_pending
  if (match.status !== 'seal_pending') {
    return NextResponse.json({
      error: `Seal activation requires status seal_pending (current: ${match.status})`,
    }, { status: 409 });
  }

  let body: ActivateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, seal_number, activation_photo_url, activated_weight } = body;

  if (!token?.trim())                return NextResponse.json({ error: 'token is required' },                { status: 422 });
  if (!seal_number?.trim())          return NextResponse.json({ error: 'seal_number is required' },          { status: 422 });
  if (!activation_photo_url?.trim()) return NextResponse.json({ error: 'activation_photo_url is required' }, { status: 422 });
  // Ensure the photo key was uploaded for this specific match (format: matchId/timestamp-random.ext)
  if (!activation_photo_url.startsWith(`${matchId}/`)) {
    return NextResponse.json({ error: 'activation_photo_url does not belong to this shipment.' }, { status: 422 });
  }
  if (typeof activated_weight !== 'number' || activated_weight <= 0) {
    return NextResponse.json({ error: 'activated_weight must be a positive number (kg)' }, { status: 422 });
  }

  // Find the active (generated) seal for this match
  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, token_hash, status, expires_at, activated_at, seal_number')
    .eq('match_id', matchId)
    .eq('status', 'generated')
    .maybeSingle();

  // Idempotency: if already activated, return existing result
  const { data: activatedSeal } = seal ? { data: null } : await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, status, activated_at')
    .eq('match_id', matchId)
    .eq('status', 'activated')
    .maybeSingle();

  if (activatedSeal) {
    return NextResponse.json({
      ok:          true,
      idempotent:  true,
      sealNumber:  activatedSeal.seal_number,
      activatedAt: activatedSeal.activated_at,
      status:      'active',
    });
  }

  if (!seal) {
    return NextResponse.json({
      error: 'No active seal found for this shipment. Generate a seal first, or the existing seal may be revoked or expired.',
    }, { status: 409 });
  }

  // Check seal has not expired
  if (new Date(seal.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This seal has expired. Generate a new seal.' }, { status: 409 });
  }

  // Cross-check: visible seal number must match DB record
  if (seal.seal_number !== seal_number.trim().toUpperCase()) {
    return NextResponse.json({
      error: 'Seal number does not match. Check the number printed on the label and try again.',
    }, { status: 422 });
  }

  // Verify the QR token: hash and compare against stored token_hash
  const submittedHash = hashToken(token.trim());
  if (submittedHash !== seal.token_hash) {
    return NextResponse.json({
      error: 'QR token is invalid or does not match this seal. The label may have been tampered with.',
    }, { status: 422 });
  }

  const nowIso = new Date().toISOString();
  const trip   = Array.isArray(match.sender_trip)
    ? (match.sender_trip as any)[0]
    : (match.sender_trip as any);
  const fromCity  = trip?.from_city ?? '';
  const toCity    = trip?.to_city   ?? '';

  // Activate the seal
  await supabase.from('shipment_secure_seals').update({
    status:               'activated',
    activated_at:         nowIso,
    activated_by:         session.email,
    traveller_confirmed_at: nowIso,
    activated_weight,
    activation_photo_url,
    updated_at:           nowIso,
  }).eq('id', seal.id);

  // Transition match to active — sealed_at is the activation timestamp
  await supabase.from('matches').update({
    status:    'active',
    sealed_at: nowIso,
  }).eq('id', matchId);

  // Write chain-of-custody events
  await supabase.from('shipment_events').insert([
    {
      match_id:     matchId,
      event_type:   'SECURESEAL_ACTIVATED',
      performed_by: session.email,
      metadata:     {
        seal_id:              seal.id,
        seal_number:          seal.seal_number,
        activated_weight,
        activation_photo_url,
        traveller:            session.email,
      },
    },
    {
      match_id:     matchId,
      event_type:   'SHIPMENT_SEALED',
      performed_by: 'system',
      metadata:     { seal_number: seal.seal_number, method: 'secureseal' },
    },
  ]);

  const adminPhone = process.env.ADMIN_PHONE;
  await Promise.allSettled([
    match.sender_email && sendSealActivatedEmail({
      toEmail: match.sender_email, role: 'sender', fromCity, toCity, matchId,
      sealNumber: seal.seal_number, otherEmail: match.traveler_email,
    }),
    match.traveler_email && sendSealActivatedEmail({
      toEmail: match.traveler_email, role: 'traveler', fromCity, toCity, matchId,
      sealNumber: seal.seal_number, otherEmail: match.sender_email,
    }),
    match.sender_email && sendSealConfirmationRequestEmail({
      toEmail: match.sender_email, fromCity, toCity, matchId, sealNumber: seal.seal_number,
    }),
    sendPushToEmail(supabase, match.sender_email, {
      title: 'SecureSeal activated 🔒',
      body:  `Your ${fromCity} → ${toCity} package is sealed and in transit. Contact details are now released.`,
      url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
    }),
    sendPushToEmail(supabase, match.traveler_email, {
      title: 'Shipment activated ✅',
      body:  `SecureSeal ${seal.seal_number} activated. You can now contact the sender for ${fromCity} → ${toCity}.`,
      url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
    }),
    adminPhone && sendSMS(
      adminPhone,
      `[BOOTHOP SEAL ACTIVATED] ${fromCity}→${toCity} Seal:${seal.seal_number} By:${session.email} Match:${matchId}`
    ).catch(() => {}),
  ]);

  return NextResponse.json({
    ok:          true,
    sealNumber:  seal.seal_number,
    activatedAt: nowIso,
    status:      'active',
  });
}
