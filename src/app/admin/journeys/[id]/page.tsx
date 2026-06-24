import { redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import JourneyDetail from './JourneyDetail';

export const dynamic = 'force-dynamic';

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
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

  if (tripRes.error || !tripRes.data) redirect('/admin');

  return <JourneyDetail trip={tripRes.data} matches={matchesRes.data || []} />;
}
