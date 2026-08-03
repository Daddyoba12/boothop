import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession, type AdminSession } from '@/lib/auth/admin-session';

// Call at the top of any admin server page component. Redirects if not admin.
export async function requireAdminPage(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore);
  if (!session) redirect('/admin/login');
  if (session.isTempPassword) redirect('/admin/change-password');
  return session;
}

// Call at the top of any admin API route handler. Returns null if not admin.
export async function requireAdminApi(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore);
}
