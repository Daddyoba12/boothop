import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = [
  'daddyoba12@gmail.com',
  ...(process.env.ADMIN_EMAILS ?? 'info@boothop.com').split(',').map(e => e.trim()).filter(Boolean),
];

export default async function AdminPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookie setting ignored
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Not logged in — send to login
  if (!session) {
    redirect('/login?next=/admin');
  }

  // Logged in but not an admin email — send to dashboard
  if (!ADMIN_EMAILS.includes(session.user.email ?? '')) {
    redirect('/dashboard');
  }

  return <AdminDashboard serverSession={session} />;
}
