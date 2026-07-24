/**
 * POST /api/matches/[id]/delivery/pin
 *
 * Sender generates a 6-digit delivery PIN. The PIN is hashed and stored on
 * the activated seal; the plaintext is returned once and emailed to the sender.
 * The sender relays the code to the receiver out-of-band (text, call, etc.).
 * The traveller enters the PIN they receive from the receiver to confirm delivery.
 *
 * Re-generation is allowed: replaces the old hash, resets attempt counter.
 * Applies only to sealed shipments (seal_pending → active path).
 * CLEARED-path shipments use the existing /confirm-delivery dual-auth flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { sendDeliveryPinEmail } from '@/lib/email/sendDeliveryPinEmail';

function generatePin(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function POST(
  _req: NextRequest,
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
      sender_trip:sender_trip_id(from_city, to_city)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email) {
    return NextResponse.json({ error: 'Only the sender can generate the delivery PIN' }, { status: 403 });
  }
  if (match.status !== 'active') {
    return NextResponse.json({
      error: `Delivery PIN can only be generated while match is active (current: ${match.status})`,
    }, { status: 409 });
  }

  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, status')
    .eq('match_id', matchId)
    .eq('status', 'activated')
    .maybeSingle();

  if (!seal) {
    return NextResponse.json({
      error: 'No activated seal found. The carrier must activate the SecureSeal before a delivery PIN can be generated.',
    }, { status: 409 });
  }

  const pin     = generatePin();
  const nowIso  = new Date().toISOString();

  await supabase.from('shipment_secure_seals').update({
    delivery_pin_hash:         hashPin(pin),
    delivery_pin_attempts:     0,
    delivery_pin_locked_at:    null,
    delivery_pin_generated_at: nowIso,
    updated_at:                nowIso,
  }).eq('id', seal.id);

  await supabase.from('shipment_events').insert({
    match_id:     matchId,
    event_type:   'DELIVERY_PIN_GENERATED',
    performed_by: session.email,
    metadata:     { seal_number: seal.seal_number },
  });

  const trip     = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : (match.sender_trip as any);
  const fromCity = trip?.from_city ?? '';
  const toCity   = trip?.to_city   ?? '';

  await sendDeliveryPinEmail({
    toEmail:  match.sender_email,
    pin,
    fromCity,
    toCity,
    matchId,
    sealNumber: seal.seal_number,
  }).catch(() => {});

  return NextResponse.json({ ok: true, pin, generatedAt: nowIso });
}
