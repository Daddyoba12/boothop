import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendContactReleasedEmail } from '@/lib/email/sendPaymentEmail';

export async function GET(request: NextRequest) {
  return handleConfirm(request);
}

export async function POST(request: NextRequest) {
  return handleConfirm(request);
}

async function handleConfirm(request: NextRequest) {
  try {
    const url      = new URL(request.url);
    const matchId  = url.searchParams.get('matchId');
    const adminKey = url.searchParams.get('adminKey');

    // Also check body for POST calls from the admin dashboard
    let bodyMatchId  = matchId;
    let bodyAdminKey = adminKey;
    if (request.method === 'POST') {
      try {
        const body   = await request.json();
        bodyMatchId  = body.matchId  ?? matchId;
        bodyAdminKey = body.adminKey ?? adminKey;
      } catch {}
    }

    const resolvedMatchId = bodyMatchId;
    const resolvedKey     = bodyAdminKey;

    if (!resolvedKey || resolvedKey !== process.env.ADMIN_SECRET) {
      if (request.method === 'GET') {
        return new NextResponse('Unauthorized.', { status: 401 });
      }
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!resolvedMatchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', resolvedMatchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.status !== 'payment_processing') {
      const msg = `Match status is '${match.status}' — already confirmed or not in payment_processing.`;
      if (request.method === 'GET') {
        return new NextResponse(msg, { status: 400 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Advance to active
    await supabase
      .from('matches')
      .update({ status: 'active', payment_confirmed_at: new Date().toISOString() })
      .eq('id', resolvedMatchId);

    const trip       = (match as any).sender_trip;
    const fromCity   = trip?.from_city   ?? '';
    const toCity     = trip?.to_city     ?? '';
    const travelDate = trip?.travel_date ?? '';

    await Promise.allSettled([
      match.sender_email && sendContactReleasedEmail({
        toEmail:    match.sender_email,
        fromCity,
        toCity,
        travelDate,
        matchId:    resolvedMatchId,
        otherEmail: match.traveler_email,
        role:       'sender',
      }),
      match.traveler_email && sendContactReleasedEmail({
        toEmail:    match.traveler_email,
        fromCity,
        toCity,
        travelDate,
        matchId:    resolvedMatchId,
        otherEmail: match.sender_email,
        role:       'traveler',
      }),
    ]);

    if (request.method === 'GET') {
      // Redirect admin to dashboard after confirming via email link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
      return NextResponse.redirect(`${appUrl}/admin?confirmed=${resolvedMatchId}`);
    }

    return NextResponse.json({ ok: true, matchId: resolvedMatchId, status: 'active' });

  } catch (error) {
    console.error('admin/confirm-payment error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
