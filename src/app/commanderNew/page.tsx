import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import CommanderNewClient from './CommanderNewClient';

export const dynamic = 'force-dynamic';

export default async function CommanderNewPage() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');

  return (
    <CommanderNewClient
      companyName={session.company}
      isSuper={session.isSuper}
      companySlug={session.slug}
    />
  );
}
