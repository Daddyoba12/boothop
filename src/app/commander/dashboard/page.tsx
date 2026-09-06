import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import CommanderNewClient from './CommanderNewClient';

export const dynamic = 'force-dynamic';

export default async function CommanderDashboard() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');

  // Superadmin lands on the All Clients control centre
  if (session.isSuper) redirect('/commander/admin/clients');

  return (
    <CommanderNewClient
      companyName={session.company}
      isSuper={session.isSuper}
      companySlug={session.slug}
    />
  );
}
