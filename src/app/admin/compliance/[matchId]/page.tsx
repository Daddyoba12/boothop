import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import ComplianceMatchDetail from './ComplianceMatchDetail';

export const dynamic = 'force-dynamic';

export default async function ComplianceMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  await requireAdminPage();
  const { matchId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, agreed_price,
      compliance_locked_at, compliance_review_started_at, sealed_at,
      declaration_id,
      sender_trip:sender_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) notFound();

  // Fetch declaration
  const { data: declaration } = match.declaration_id
    ? await supabase
        .from('item_declarations')
        .select('*')
        .eq('id', match.declaration_id)
        .maybeSingle()
    : { data: null };

  // Fetch chain-of-custody events
  const { data: events } = await supabase
    .from('shipment_events')
    .select('id, event_type, performed_by, metadata, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return (
    <ComplianceMatchDetail
      match={match}
      declaration={declaration}
      events={events ?? []}
    />
  );
}
