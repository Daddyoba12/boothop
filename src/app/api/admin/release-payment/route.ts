import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendRatingRequestEmail } from '@/lib/email/sendRatingEmail';

export async function GET(request: NextRequest) {
  try {
    const url      = new URL(request.url);
    const matchId  = url.searchParams.get('matchId');
    const adminKey = url.searchParams.get('adminKey');

    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return new NextResponse('Unauthorized.', { status: 401 });
    }
    if (!matchId) {
      return new NextResponse('matchId required.', { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: match } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) {
      return new NextResponse('Match not found.', { status: 404 });
    }

    if (match.status === 'completed') {
      return new NextResponse('Already marked as completed.', { status: 400 });
    }

    await supabase
      .from('matches')
      .update({ status: 'completed', payment_released_at: new Date().toISOString() })
      .eq('id', matchId);

    const tripRaw    = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
    const trip       = tripRaw as unknown as { from_city: string; to_city: string } | null | undefined;
    const fromCity   = trip?.from_city ?? '';
    const toCity     = trip?.to_city ?? '';
    const agreedPrice = (match as any).agreed_price ?? 0;

    await Promise.allSettled([
      sendRatingRequestEmail({ toEmail: match.sender_email,   fromCity, toCity, matchId, role: 'sender',   agreedPrice }),
      sendRatingRequestEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler', agreedPrice }),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    return NextResponse.redirect(`${appUrl}/admin?released=${matchId}`);

  } catch (error) {
    console.error('admin/release-payment error:', error);
    return new NextResponse('Something went wrong.', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('id', matchId)
      .maybeSingle();

    await supabase
      .from('matches')
      .update({ status: 'completed', payment_released_at: new Date().toISOString() })
      .eq('id', matchId);

    if (match) {
      const tripRaw    = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
      const trip       = tripRaw as unknown as { from_city: string; to_city: string } | null | undefined;
      const fromCity   = trip?.from_city ?? '';
      const toCity     = trip?.to_city ?? '';
      const agreedPrice = (match as any).agreed_price ?? 0;
      await Promise.allSettled([
        sendRatingRequestEmail({ toEmail: match.sender_email,   fromCity, toCity, matchId, role: 'sender',   agreedPrice }),
        sendRatingRequestEmail({ toEmail: match.traveler_email, fromCity, toCity, matchId, role: 'traveler', agreedPrice }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin/release-payment POST error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
