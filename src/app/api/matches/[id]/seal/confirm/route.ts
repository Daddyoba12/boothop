/**
 * POST /api/matches/[id]/seal/confirm
 *
 * Sender explicitly confirms they observed the seal being applied.
 * Non-blocking — the match is already 'active' by the time the sender taps this.
 * Sets sender_confirmed_at on the activated seal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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
    .select('id, sender_email, traveler_email')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email) {
    return NextResponse.json({ error: 'Only the sender can confirm seal application' }, { status: 403 });
  }

  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, sender_confirmed_at, seal_number')
    .eq('match_id', matchId)
    .eq('status', 'activated')
    .maybeSingle();

  if (!seal) {
    return NextResponse.json({ error: 'No activated seal found for this match' }, { status: 404 });
  }

  // Idempotent: already confirmed
  if (seal.sender_confirmed_at) {
    return NextResponse.json({ ok: true, idempotent: true, sealNumber: seal.seal_number });
  }

  const nowIso = new Date().toISOString();
  await supabase
    .from('shipment_secure_seals')
    .update({ sender_confirmed_at: nowIso, updated_at: nowIso })
    .eq('id', seal.id);

  await supabase.from('shipment_events').insert({
    match_id:     matchId,
    event_type:   'SECURESEAL_SENDER_CONFIRMED',
    performed_by: session.email,
    metadata:     { seal_number: seal.seal_number },
  });

  return NextResponse.json({ ok: true, sealNumber: seal.seal_number, confirmedAt: nowIso });
}
