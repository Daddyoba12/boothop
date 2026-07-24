/**
 * POST /api/matches/[id]/delivery/confirm-pin
 *
 * Traveller enters the 6-digit PIN received from the receiver at the door.
 * On correct PIN, the match transitions to delivery_confirmed.
 *
 * Stripe capture is NOT triggered here. The existing auto-payout cron handles
 * both capture and transfer to the traveller 24 hours after delivery_confirmed,
 * skipping any match with an open dispute — that window is the sender's
 * opportunity to raise an issue via POST /delivery/report-issue.
 *
 * Lockout: 5 incorrect attempts → delivery_pin_locked_at set, admin alerted.
 * Admin must clear the lock manually.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendSMS } from '@/lib/services/telnyx';
import { sendPushToEmail } from '@/lib/services/notifications';
import { sendResendEmail } from '@/lib/resend-client';
import crypto from 'crypto';

const MAX_PIN_ATTEMPTS = 5;

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
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
      delivery_confirmed_at,
      sender_trip:sender_trip_id(from_city, to_city)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Only the carrier can confirm delivery via PIN' }, { status: 403 });
  }

  // Idempotent: already confirmed
  if (match.status === 'delivery_confirmed' || match.status === 'completed') {
    return NextResponse.json({
      ok:          true,
      idempotent:  true,
      confirmedAt: match.delivery_confirmed_at,
      status:      match.status,
    });
  }

  if (match.status !== 'active') {
    return NextResponse.json({
      error: `PIN confirmation requires match status active (current: ${match.status})`,
    }, { status: 409 });
  }

  let body: { pin?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pin = typeof body.pin === 'string' ? body.pin.trim() : null;
  if (!pin) return NextResponse.json({ error: 'pin is required' }, { status: 422 });

  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, delivery_pin_hash, delivery_pin_attempts, delivery_pin_locked_at')
    .eq('match_id', matchId)
    .eq('status', 'activated')
    .maybeSingle();

  if (!seal) {
    return NextResponse.json({
      error: 'No activated seal found for this shipment',
    }, { status: 409 });
  }

  if (!seal.delivery_pin_hash) {
    return NextResponse.json({
      error: 'No delivery PIN has been generated yet. Ask the sender to generate the PIN first.',
    }, { status: 422 });
  }

  if (seal.delivery_pin_locked_at) {
    return NextResponse.json({
      error: 'Delivery PIN is locked after too many incorrect attempts. Please contact support.',
    }, { status: 403 });
  }

  const submittedHash = hashPin(pin);
  const nowIso        = new Date().toISOString();

  if (submittedHash !== seal.delivery_pin_hash) {
    const newAttempts = (seal.delivery_pin_attempts ?? 0) + 1;
    const locked      = newAttempts >= MAX_PIN_ATTEMPTS;

    await supabase.from('shipment_secure_seals').update({
      delivery_pin_attempts:  newAttempts,
      delivery_pin_locked_at: locked ? nowIso : null,
      updated_at:             nowIso,
    }).eq('id', seal.id);

    if (locked) {
      await supabase.from('shipment_events').insert({
        match_id:     matchId,
        event_type:   'DELIVERY_PIN_LOCKED',
        performed_by: session.email,
        metadata:     { attempts: newAttempts, seal_number: seal.seal_number },
      });

      const adminPhone = process.env.ADMIN_PHONE;
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
      const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? '';

      await Promise.allSettled([
        adminPhone && sendSMS(adminPhone,
          `[BOOTHOP] Delivery PIN locked after ${MAX_PIN_ATTEMPTS} attempts. Match:${matchId} Seal:${seal.seal_number} Carrier:${session.email}`
        ).catch(() => {}),
        sendResendEmail({
          from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
          to:      adminEmail,
          subject: `[DELIVERY PIN LOCKED] Match ${matchId} — ${MAX_PIN_ATTEMPTS} failed attempts`,
          text:    `Delivery PIN locked for match ${matchId} (seal ${seal.seal_number}). Carrier: ${session.email}. Review: ${appUrl}/admin/compliance/${matchId}`,
        }).catch(() => {}),
      ]);

      return NextResponse.json({
        error:   'Too many incorrect attempts. The delivery PIN has been locked. Please contact support.',
        locked:  true,
      }, { status: 403 });
    }

    return NextResponse.json({
      error:           'Incorrect PIN. Please check the code with the receiver and try again.',
      attemptsUsed:    newAttempts,
      attemptsRemaining: MAX_PIN_ATTEMPTS - newAttempts,
    }, { status: 422 });
  }

  // Correct PIN
  await supabase.from('shipment_secure_seals').update({
    delivery_pin_attempts: 0,
    updated_at:            nowIso,
  }).eq('id', seal.id);

  await supabase.from('matches').update({
    status:               'delivery_confirmed',
    locked_at:            nowIso,  // opens 7-day messaging dispute window
    delivery_confirmed_at: nowIso,
  }).eq('id', matchId);

  const escrowReleaseAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  await supabase.from('shipment_events').insert([
    {
      match_id:     matchId,
      event_type:   'DELIVERY_PIN_CONFIRMED',
      performed_by: session.email,
      metadata:     { seal_number: seal.seal_number },
    },
    {
      match_id:     matchId,
      event_type:   'DELIVERY_CONFIRMED',
      performed_by: 'system',
      metadata:     { method: 'pin', confirmed_by: session.email, escrow_release_at: escrowReleaseAt },
    },
  ]);

  const trip     = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : (match.sender_trip as any);
  const fromCity = trip?.from_city ?? '';
  const toCity   = trip?.to_city   ?? '';

  await Promise.allSettled([
    sendPushToEmail(supabase, match.sender_email, {
      title: 'Delivery confirmed ✅',
      body:  `Your ${fromCity} → ${toCity} package has been delivered. Payment releases to the carrier in 24 hours unless you report an issue.`,
      url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
    }),
    sendPushToEmail(supabase, match.traveler_email, {
      title: 'Delivery confirmed ✅',
      body:  `Delivery confirmed for ${fromCity} → ${toCity}. Payment will transfer to your account within 24 hours.`,
      url:   `${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}`,
    }),
  ]);

  return NextResponse.json({
    ok:             true,
    confirmedAt:    nowIso,
    escrowReleaseAt,
    status:         'delivery_confirmed',
  });
}
