import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendDeclarationPromptEmail, sendTravelerComplianceWaitEmail } from '@/lib/email/sendComplianceEmail';

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
  return NextResponse.redirect(`${appUrl}/admin?compliance_locked=${matchId}`);
}

// POST — called from the Hub dashboard; authenticated by session cookie.
export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { matchId } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });

  const result = await confirmPayment(matchId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, matchId, status: 'locked_pending_compliance' });
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

    const nowIso = new Date().toISOString();

    await supabase
      .from('matches')
      .update({
        status:               'locked_pending_compliance',
        payment_confirmed_at: nowIso,
        compliance_locked_at: nowIso,
      })
      .eq('id', matchId);

    // Write SHIPMENT_LOCKED chain-of-custody event
    await supabase.from('shipment_events').insert({
      match_id:     matchId,
      event_type:   'SHIPMENT_LOCKED',
      performed_by: 'admin-email-link',
      metadata:     { triggered_by: 'confirm-payment' },
    });

    const trip       = (match as any).sender_trip;
    const fromCity   = trip?.from_city   ?? '';
    const toCity     = trip?.to_city     ?? '';

    // Sender must now submit declaration; traveller waits for compliance clearance
    await Promise.allSettled([
      match.sender_email && sendDeclarationPromptEmail({
        toEmail: match.sender_email, fromCity, toCity, matchId,
      }),
      match.traveler_email && sendTravelerComplianceWaitEmail({
        toEmail: match.traveler_email, fromCity, toCity, matchId,
      }),
    ]);

    return { ok: true };
  } catch (error) {
    console.error('admin/confirm-payment error:', error);
    return { ok: false, error: 'Something went wrong.', status: 500 };
  }
}
