/**
 * GET /api/matches/[id]/seal/current
 *
 * Returns current seal state for display purposes.
 * Both sender and traveller may view.
 * The raw token is NEVER returned — it is one-time delivery via /seal/generate only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const cookieStore = await cookies();
  const session     = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('sender_email, traveler_email')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email && match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, status, generated_at, expires_at, activated_at, sender_confirmed_at')
    .eq('match_id', matchId)
    .not('status', 'in', '("revoked","expired")')
    .maybeSingle();

  return NextResponse.json({ seal: seal ?? null });
}
