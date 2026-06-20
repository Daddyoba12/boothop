import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth/session';

// Single source of truth — set ADMIN_EMAILS in .env as a comma-separated list.
// e.g. ADMIN_EMAILS=you@gmail.com,info@boothop.com
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// Call at the top of any admin server page component. Redirects if not admin.
export async function requireAdminPage(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session) redirect('/login?next=/admin');
  if (!isAdminEmail(session.email)) redirect('/dashboard');
  return session;
}

// Call at the top of any admin API route handler. Returns null if not admin.
export async function requireAdminApi(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session || !isAdminEmail(session.email)) return null;
  return session;
}
