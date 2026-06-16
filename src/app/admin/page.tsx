import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth/session';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = [
  'daddyoba12@gmail.com',
  ...(process.env.ADMIN_EMAILS ?? 'info@boothop.com').split(',').map(e => e.trim()).filter(Boolean),
];

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);

  if (!session) {
    redirect('/login?next=/admin');
  }

  if (!ADMIN_EMAILS.includes(session.email)) {
    redirect('/dashboard');
  }

  return <AdminDashboard serverSession={{ user: { email: session.email } }} />;
}
