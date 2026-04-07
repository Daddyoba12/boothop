import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { sendDisputeRaisedAdminEmail, sendDisputeAcknowledgedEmail } from '@/lib/email/sendDisputeEmail';

const DISPUTE_REASONS = [
  'Item not delivered',
  'Item damaged',
  'Wrong item delivered',
  'Item not as described',
  'No contact from other party',
  'Other',
];

// Matches that can have disputes raised (post-payment only)
const DISPUTABLE_STATUSES = ['active', 'delivery_confirmed', 'payment_processing'];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, reason, description } = await request.json();

    if (!matchId || !reason || !description?.trim()) {
      return NextResponse.json({ error: 'matchId, reason and description are required.' }, { status: 400 });
    }

    if (!DISPUTE_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid dispute reason.' }, { status: 400 });
    }

    if (description.trim().length < 20) {
      return NextResponse.json({ error: 'Please provide more detail (at least 20 characters).' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (!DISPUTABLE_STATUSES.includes(match.status)) {
      return NextResponse.json({
        error: 'Disputes can only be raised for active matches. For pre-payment issues, please cancel the match instead.',
      }, { status: 400 });
    }

    // Check no open dispute already exists
    const { data: existing } = await supabase
      .from('disputes')
      .select('id')
      .eq('match_id', matchId)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'There is already an open dispute for this match.' }, { status: 409 });
    }

    // Create the dispute
    const { data: dispute, error: insertErr } = await supabase
      .from('disputes')
      .insert({
        match_id:    matchId,
        raised_by:   email,
        reason,
        description: description.trim(),
        status:      'open',
      })
      .select('id')
      .single();

    if (insertErr || !dispute) {
      throw new Error('Failed to create dispute.');
    }

    // Lock the match
    await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', matchId);

    const trip       = (match as any).sender_trip;
    const fromCity   = trip?.from_city ?? '';
    const toCity     = trip?.to_city   ?? '';
    const otherParty = match.sender_email === email ? match.traveler_email : match.sender_email;

    await Promise.allSettled([
      sendDisputeRaisedAdminEmail({
        disputeId:   dispute.id,
        matchId,
        raisedBy:    email,
        otherParty,
        reason,
        description: description.trim(),
        fromCity,
        toCity,
        agreedPrice: match.agreed_price ?? 0,
      }),
      sendDisputeAcknowledgedEmail({
        toEmail:   email,
        fromCity,
        toCity,
        disputeId: dispute.id,
      }),
    ]);

    return NextResponse.json({ ok: true, disputeId: dispute.id });

  } catch (error) {
    console.error('disputes/create error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
