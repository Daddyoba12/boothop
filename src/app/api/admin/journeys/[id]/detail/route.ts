import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const [tripRes, matchesRes] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).single(),
    supabase
      .from('matches')
      .select('*')
      .or(`sender_trip_id.eq.${id},traveler_trip_id.eq.${id}`)
      .order('created_at', { ascending: false }),
  ]);

  if (tripRes.error) {
    return NextResponse.json({ error: tripRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    trip: tripRes.data,
    matches: matchesRes.data || [],
  });
}
