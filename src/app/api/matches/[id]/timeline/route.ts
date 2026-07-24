import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserFacingLabel } from '@/lib/events/userFacingLabels';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('id, sender_email, traveler_email')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const isSender   = match.sender_email   === session.email;
  const isTraveler = match.traveler_email === session.email;
  if (!isSender && !isTraveler) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { data: events } = await supabase
    .from('shipment_events')
    .select('id, event_type, performed_by, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  const mapped = (events ?? []).map(e => {
    const { label, description } = getUserFacingLabel(e.event_type);
    const actor = e.performed_by === session.email ? 'You' : 'BootHop';
    return { id: e.id, label, description, actor, timestamp: e.created_at };
  });

  return NextResponse.json({ events: mapped });
}
