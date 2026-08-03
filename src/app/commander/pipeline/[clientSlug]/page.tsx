import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import CommanderNewClient from '@/app/commanderNew/CommanderNewClient';

export const dynamic = 'force-dynamic';

export default async function ClientPipelinePage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;

  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');
  if (!session.isSuper) redirect('/commander/dashboard');

  const db = createSupabaseAdminClient();
  const { data: client } = await db
    .from('pipeline_clients')
    .select('id, company, slug, oracle_pipeline')
    .eq('slug', clientSlug.toLowerCase())
    .single();

  if (!client) notFound();

  return (
    <CommanderNewClient
      companyName={client.company}
      isSuper={true}
      companySlug={session.slug}
      targetSlug={client.slug}
    />
  );
}
