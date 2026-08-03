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

  const normalised = clientSlug.toLowerCase();

  // Regular clients can only view their own pipeline
  if (!session.isSuper && session.slug !== normalised) redirect('/commander/dashboard');

  const db = createSupabaseAdminClient();
  const { data: client } = await db
    .from('pipeline_clients')
    .select('id, company, slug, oracle_pipeline')
    .eq('slug', normalised)
    .single();

  if (!client) notFound();

  // Only inject forClient when superadmin is managing another client's pipeline
  const targetSlug = session.isSuper ? client.slug : undefined;

  return (
    <CommanderNewClient
      companyName={client.company}
      isSuper={session.isSuper}
      companySlug={session.slug}
      targetSlug={targetSlug}
    />
  );
}
