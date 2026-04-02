import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // ✅ Initialize Stripe inside the function
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });

    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId required' }, { status: 400 });
    }

    // Get auth token from cookie header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check user is part of this match
    const isSender   = match.sender_user_id   === user.id;
    const isTraveler = match.traveler_user_id  === user.id;
    if (!isSender && !isTraveler) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check not already verified
    const kycField = isSender ? 'sender_kyc_status' : 'traveler_kyc_status';
    if (match[kycField] === 'verified') {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    // Create Stripe Identity verification session
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        match_id:  matchId,
        user_id:   user.id,
        user_role: isSender ? 'sender' : 'traveler',
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_id_number:        true,
          require_live_capture:     true,
          require_matching_selfie:  true,
        },
      },
      return_url: `${appUrl}/kyc/${matchId}?kyc_return=1`,
    });

    // Store session ID on match
    const sessionIdField = isSender ? 'sender_kyc_session_id' : 'traveler_kyc_session_id';
    await supabase
      .from('matches')
      .update({
        [sessionIdField]: session.id,
        [kycField]: 'pending',
      })
      .eq('id', matchId);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('KYC session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
