import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBdSession } from '@/lib/auth/session';

export default async function BDPipeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session     = getBdSession(cookieStore);
  if (!session) redirect('/BDpipe/login');
  return <>{children}</>;
}
