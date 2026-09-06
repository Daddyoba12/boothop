import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import AllClientsClient from './AllClientsClient';

export const dynamic = 'force-dynamic';

export default async function AllClientsPage() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');
  if (!session.isSuper) redirect('/commander/dashboard');

  const db = createSupabaseAdminClient();
  const { data: clients } = await db
    .from('pipeline_clients')
    .select('id, slug, company, email, contact_name, plan, status, created_at, is_super_admin, oracle_pipeline')
    .order('created_at', { ascending: false });

  return (
    <AllClientsClient
      clients={clients ?? []}
      adminName={session.company}
      adminSlug={session.slug}
    />
  );
}
