import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });

    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    // Get match and verify participation
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, sender_kyc_status, traveler_kyc_status')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isSender   = match.sender_email   === email;
    const isTraveler = match.traveler_email === email;
    if (!isSender && !isTraveler) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Must be in committed or later status
    if (!['committed', 'kyc_pending', 'kyc_complete'].includes(match.status)) {
      return NextResponse.json({ error: 'KYC is not available at this stage.' }, { status: 400 });
    }

    const role     = isSender ? 'sender' : 'traveler';
    const kycField = isSender ? 'sender_kyc_status' : 'traveler_kyc_status';

    // Don't restart if already verified
    if (match[kycField] === 'verified') {
      return NextResponse.json({ error: 'Your identity is already verified.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const stripeSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        match_id:  matchId,
        email,
        user_role: role,
      },
      options: {
        document: {
          allowed_types:           ['driving_license', 'passport', 'id_card'],
          require_id_number:       true,
          require_live_capture:    true,
          require_matching_selfie: true,
        },
      },
      return_url: `${appUrl}/kyc?matchId=${matchId}&kyc_return=1`,
    });

    // Mark as pending + store session ID
    const sessionIdField = isSender ? 'sender_kyc_session_id' : 'traveler_kyc_session_id';
    await supabase
      .from('matches')
      .update({
        [kycField]:       'pending',
        [sessionIdField]: stripeSession.id,
        status:           match.status === 'committed' ? 'kyc_pending' : match.status,
      })
      .eq('id', matchId);

    return NextResponse.json({ url: stripeSession.url });

  } catch (error: any) {
    console.error('kyc/create-session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
