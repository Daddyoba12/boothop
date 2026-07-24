/**
 * GET /api/matches/[id]/verification-providers
 *
 * Returns active verification providers for the match participants to view.
 * Only accessible when the match is in external_verification_required status.
 * Callers must be a participant on the match (sender or traveler).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function getSession() {
  const cookieStore = await cookies();
  return getAppSession(cookieStore);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const session = await getSession();
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email && match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  if (match.status !== 'external_verification_required') {
    return NextResponse.json({ providers: [] });
  }

  // Filter by country of origin (from_city country) — fall back to all active providers
  const { data: providers } = await supabase
    .from('verification_providers')
    .select('id, name, provider_type, country, city, address, email, phone, instructions, supported_services')
    .eq('active', true)
    .order('name', { ascending: true });

  return NextResponse.json({ providers: providers ?? [] });
}
