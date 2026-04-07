import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { sendAdminPaymentAlertEmail, sendPaymentRequestedEmail } from '@/lib/email/sendPaymentEmail';

const INSURANCE_RATE = 0.075;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, goodsValue, insuranceAccepted } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_kyc_status, traveler_kyc_status, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.sender_email !== email) {
      return NextResponse.json({ error: 'Only the sender can initiate payment.' }, { status: 403 });
    }

    if (!['kyc_complete', 'payment_pending'].includes(match.status)) {
      return NextResponse.json({ error: 'Match is not ready for payment.' }, { status: 400 });
    }

    const parsedGoods   = parseFloat(goodsValue) || 0;
    const insuranceFee  = insuranceAccepted && parsedGoods > 0 ? parsedGoods * INSURANCE_RATE : 0;
    const totalDue      = (match.agreed_price ?? 0) + insuranceFee;

    // Mark as payment_processing
    await supabase
      .from('matches')
      .update({
        status:            'payment_processing',
        goods_value:       parsedGoods || null,
        insurance_fee:     insuranceFee || null,
        insurance_accepted: insuranceAccepted,
      })
      .eq('id', matchId);

    const trip     = (match as any).sender_trip;
    const fromCity = trip?.from_city  ?? '';
    const toCity   = trip?.to_city    ?? '';
    const travelDate = trip?.travel_date ?? '';

    await Promise.allSettled([
      sendAdminPaymentAlertEmail({
        matchId,
        senderEmail:      match.sender_email,
        travelerEmail:    match.traveler_email,
        fromCity,
        toCity,
        travelDate,
        agreedPrice:      match.agreed_price ?? 0,
        goodsValue:       parsedGoods,
        insuranceAccepted,
        insuranceFee,
        totalDue,
      }),
      sendPaymentRequestedEmail({
        toEmail:  match.sender_email,
        fromCity,
        toCity,
        totalDue,
        matchId,
      }),
    ]);

    return NextResponse.json({ ok: true, totalDue });

  } catch (error) {
    console.error('payment/request error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
