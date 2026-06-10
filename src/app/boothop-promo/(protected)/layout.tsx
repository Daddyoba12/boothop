import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBdSession } from '@/lib/auth/session';
import Link from 'next/link';

const NAV = [
  { href: '/boothop-promo',           label: '⚡ Overview'  },
  { href: '/boothop-promo/generate',  label: '✨ Generate'  },
  { href: '/boothop-promo/library',   label: '📚 Library'   },
  { href: '/boothop-promo/publish',   label: '🚀 Publish'   },
  { href: '/boothop-promo/analytics', label: '📊 Analytics' },
  { href: '/boothop-promo/manual',    label: '📖 Manual'    },
];

export default async function PromoLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session     = getBdSession(cookieStore);
  if (!session) redirect('/boothop-promo/login');

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={{ background: '#111827', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', gap: 4, padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/boothop-promo" style={{ marginRight: 24, fontWeight: 800, fontSize: 15, color: '#7C3AED', textDecoration: 'none' }}>🎯 BootHop Promo</Link>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ borderRadius: 8, color: '#9CA3AF', fontSize: 13, padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {n.label}
          </Link>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <a href="/api/bd/signout" style={{ color: '#6B7280', fontSize: 12, textDecoration: 'none' }}>Sign out</a>
        </div>
      </nav>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
}
