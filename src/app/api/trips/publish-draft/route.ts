import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSessionCookieName, verifyAppSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const session = verifyAppSession(token);
    const { draftId } = await request.json();
    if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    // Fetch draft and verify ownership
    const { data: draft } = await supabase
      .from('journey_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('email', session.email)
      .eq('status', 'draft')
      .single();

    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // Look up the user_id from auth (needed for trips table)
    let userId = draft.user_id;
    if (!userId) {
      const { data: authUser } = await (supabase.auth.admin as any).getUserByEmail(session.email).catch(() => ({ data: null }));
      userId = authUser?.user?.id || null;
    }
    if (!userId) return NextResponse.json({ error: 'User account not found — please contact support' }, { status: 400 });

    // Insert into trips
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert({
        user_id:     userId,
        type:        draft.type,
        from_city:   draft.from_city,
        to_city:     draft.to_city,
        travel_date: draft.travel_date,
        weight:      draft.weight,
        price:       draft.price,
        status:      'active',
      })
      .select()
      .single();

    if (tripErr || !trip) throw tripErr || new Error('Failed to create trip');

    // Mark draft as published
    await supabase.from('journey_drafts').update({ status: 'published' }).eq('id', draftId);

    // Run match engine (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    fetch(`${appUrl}/api/match-engine`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tripId: trip.id }),
    }).catch(e => console.error('Match engine error (non-blocking):', e));

    return NextResponse.json({ ok: true, tripId: trip.id });

  } catch (error) {
    console.error('publish-draft error:', error);
    return NextResponse.json({ error: 'Failed to publish draft' }, { status: 500 });
  }
}
