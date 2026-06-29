import { redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import PipelineAdminClient from './PipelineAdminClient';

export const dynamic = 'force-dynamic';

export default async function PipelineAdminPage() {
  await requireAdminPage();

  const db = createSupabaseAdminClient();
  const { data: clients, error } = await db
    .from('pipeline_clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error && error.code !== 'PGRST116') {
    // Table doesn't exist yet — show empty state
  }

  return <PipelineAdminClient clients={clients ?? []} />;
}
