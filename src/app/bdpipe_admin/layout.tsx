import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBdSession } from '@/lib/auth/session';
import Link from 'next/link';

const NAV = [
  { href: '/bdpipe_admin',           label: '⚡ Overview'  },
  { href: '/bdpipe_admin/generate',  label: '✨ Generate'  },
  { href: '/bdpipe_admin/library',   label: '📚 Library'   },
  { href: '/bdpipe_admin/publish',   label: '🚀 Publish'   },
  { href: '/bdpipe_admin/analytics', label: '📊 Analytics' },
  { href: '/BDpipe',                 label: '👁 View'       },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session     = getBdSession(cookieStore);
  if (!session) redirect('/bdpipe_admin/login');

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#111827', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', gap: 4, padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/bdpipe_admin" style={{ marginRight: 24, fontWeight: 800, fontSize: 15, color: '#7C3AED', textDecoration: 'none' }}>🌍 BD Pipeline</Link>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ borderRadius: 8, color: '#9CA3AF', fontSize: 13, padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {n.label}
          </Link>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <form action="/api/bd/auth" method="DELETE">
            <a href="/bdpipe_admin/login" onClick={async e => { e.preventDefault(); await fetch('/api/bd/auth',{method:'DELETE'}); window.location.href='/bdpipe_admin/login'; }} style={{ color: '#6B7280', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>Sign out</a>
          </form>
        </div>
      </nav>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
}
