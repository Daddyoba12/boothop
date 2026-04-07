import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { sendBothTermsAcceptedEmail } from '@/lib/email/sendTermsEmail';

const TERMS_VERSION = '2025-04-07';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    // Get real IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    // Verify this person is a participant in this match
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not a participant in this match.' }, { status: 403 });
    }

    if (!['matched', 'agreed'].includes(match.status)) {
      return NextResponse.json({ error: 'Terms can only be accepted for active matches.' }, { status: 400 });
    }

    // Check if already accepted
    const { data: existing } = await supabase
      .from('terms_acceptance')
      .select('id')
      .eq('match_id', matchId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, message: 'Already accepted.' });
    }

    // Record acceptance
    await supabase.from('terms_acceptance').insert({
      match_id:      matchId,
      email,
      terms_version: TERMS_VERSION,
      accepted:      true,
      ip_address:    ip,
      accepted_at:   new Date().toISOString(),
    });

    // Check if both parties have now accepted
    const { data: acceptances } = await supabase
      .from('terms_acceptance')
      .select('email')
      .eq('match_id', matchId)
      .eq('accepted', true);

    const acceptedEmails = (acceptances ?? []).map((a: any) => a.email);
    const senderAccepted   = acceptedEmails.includes(match.sender_email);
    const travelerAccepted = acceptedEmails.includes(match.traveler_email);

    if (senderAccepted && travelerAccepted) {
      // Both accepted — advance to 'committed', trigger KYC emails
      await supabase
        .from('matches')
        .update({ status: 'committed' })
        .eq('id', matchId);

      const trip = (match as any).sender_trip;
      if (trip) {
        const emailBase = { fromCity: trip.from_city, toCity: trip.to_city, matchId };
        await Promise.allSettled([
          match.sender_email   && sendBothTermsAcceptedEmail({ toEmail: match.sender_email,   ...emailBase }),
          match.traveler_email && sendBothTermsAcceptedEmail({ toEmail: match.traveler_email, ...emailBase }),
        ]);
      }

      return NextResponse.json({ ok: true, bothAccepted: true, redirectTo: `/kyc?matchId=${matchId}` });
    }

    return NextResponse.json({ ok: true, bothAccepted: false, message: 'Accepted. Waiting for the other party.' });

  } catch (error) {
    console.error('terms/accept error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
