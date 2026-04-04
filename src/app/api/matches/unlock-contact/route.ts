import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json();
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    // Fetch match to verify conditions server-side
    const { data: match } = await supabase
      .from('matches')
      .select('id, sender_accepted, traveler_accepted, payment_status, sender_kyc_status, traveler_kyc_status, contact_unlocked')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    if (match.contact_unlocked) return NextResponse.json({ already: true });

    const allConditionsMet =
      match.sender_accepted &&
      match.traveler_accepted &&
      match.payment_status === 'escrowed' &&
      match.sender_kyc_status === 'verified' &&
      match.traveler_kyc_status === 'verified';

    if (!allConditionsMet) {
      return NextResponse.json({ unlocked: false, reason: 'Conditions not yet met' });
    }

    await supabase
      .from('matches')
      .update({ contact_unlocked: true })
      .eq('id', matchId);

    return NextResponse.json({ unlocked: true });

  } catch (error) {
    console.error('Unlock contact error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
