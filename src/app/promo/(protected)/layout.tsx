import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBdSession } from '@/lib/auth/session';
import Link from 'next/link';

const NAV = [
  { href: '/promo',           label: '⚡ Overview'  },
  { href: '/promo/generate',  label: '✨ Generate'  },
  { href: '/promo/library',   label: '📚 Library'   },
  { href: '/promo/publish',   label: '🚀 Publish'   },
  { href: '/promo/analytics', label: '📊 Analytics' },
  { href: '/promo/tiktok-auth', label: '🎵 TikTok'    },
  { href: '/promo/manual',      label: '📖 Manual'    },
];

export default async function PromoLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session     = getBdSession(cookieStore);
  if (!session) redirect('/promo/login');

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <nav style={{ background: '#111827', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', gap: 4, padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/promo" style={{ marginRight: 24, fontWeight: 800, fontSize: 15, color: '#7C3AED', textDecoration: 'none' }}>🎯 BootHop Promo</Link>
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
