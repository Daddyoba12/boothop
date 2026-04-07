import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { rating, comment } = await request.json();
    const { id: matchId } = await params;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (!['completed', 'delivery_confirmed'].includes(match.status)) {
      return NextResponse.json({ error: 'Ratings can only be submitted after delivery is complete.' }, { status: 400 });
    }

    const isSender   = match.sender_email   === email;
    const isTraveler = match.traveler_email === email;
    if (!isSender && !isTraveler) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const revieweeEmail = isSender ? match.traveler_email : match.sender_email;

    // Prevent duplicate rating
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('match_id', matchId)
      .eq('reviewer_email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a rating for this match.' }, { status: 409 });
    }

    await supabase.from('ratings').insert({
      match_id:      matchId,
      reviewer_email: email,
      reviewee_email: revieweeEmail,
      rating,
      comment:       comment?.trim() ?? null,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('matches/[id]/rate error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
