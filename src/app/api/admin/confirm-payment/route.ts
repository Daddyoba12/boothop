import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendContactReleasedEmail } from '@/lib/email/sendPaymentEmail';

// GET — triggered from an email link; authenticated by ADMIN_SECRET in query string.
export async function GET(request: NextRequest) {
  const url      = new URL(request.url);
  const matchId  = url.searchParams.get('matchId');
  const adminKey = url.searchParams.get('adminKey');

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return new NextResponse('Unauthorized.', { status: 401 });
  }
  if (!matchId) return new NextResponse('matchId is required.', { status: 400 });

  const result = await confirmPayment(matchId);
  if (!result.ok) return new NextResponse(result.error, { status: result.status });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
  return NextResponse.redirect(`${appUrl}/admin?confirmed=${matchId}`);
}

// POST — called from the Hub dashboard; authenticated by session cookie.
export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });

  const result = await confirmPayment(matchId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, matchId, status: 'active' });
}

async function confirmPayment(matchId: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) return { ok: false, error: 'Match not found.', status: 404 };

    if (match.status !== 'payment_processing') {
      return { ok: false, error: `Match status is '${match.status}' — already confirmed or not in payment_processing.`, status: 400 };
    }

    await supabase
      .from('matches')
      .update({ status: 'active', payment_confirmed_at: new Date().toISOString() })
      .eq('id', matchId);

    const trip       = (match as any).sender_trip;
    const fromCity   = trip?.from_city   ?? '';
    const toCity     = trip?.to_city     ?? '';
    const travelDate = trip?.travel_date ?? '';

    await Promise.allSettled([
      match.sender_email && sendContactReleasedEmail({
        toEmail: match.sender_email, fromCity, toCity, travelDate, matchId, otherEmail: match.traveler_email, role: 'sender',
      }),
      match.traveler_email && sendContactReleasedEmail({
        toEmail: match.traveler_email, fromCity, toCity, travelDate, matchId, otherEmail: match.sender_email, role: 'traveler',
      }),
    ]);

    return { ok: true };
  } catch (error) {
    console.error('admin/confirm-payment error:', error);
    return { ok: false, error: 'Something went wrong.', status: 500 };
  }
}
