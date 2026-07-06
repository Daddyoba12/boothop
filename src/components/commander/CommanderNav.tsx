'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  company: string;
  slug:    string;
  isSuper: boolean;
}

export default function CommanderNav({ company, slug, isSuper }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/commander/logout', { method: 'POST' });
    router.push('/commander');
  }

  const links = [
    { href: '/commander/dashboard', label: isSuper ? 'All Clients' : 'Dashboard' },
    { href: '/commander/music',     label: 'Music' },
  ];

  return (
    <nav className="border-b border-white/8 bg-[#07111f]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/commander/dashboard" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/boothop-icon-512.png" alt="" className="h-7 w-auto rounded-lg" style={{ mixBlendMode: 'screen' }} />
            <div className="hidden sm:block leading-tight">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em]">Pipeline</p>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.1em]">Commander</p>
            </div>
          </Link>
          <span className="hidden sm:block text-white/15 text-sm">/</span>
          <span className="hidden sm:block text-xs font-semibold text-white/50 truncate max-w-[140px]">{company}</span>
          {isSuper && (
            <span className="hidden sm:block text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 uppercase tracking-wider">Admin</span>
          )}
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === href
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right: slug + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] font-mono text-white/20">{slug}</span>
          <button onClick={handleLogout} disabled={loggingOut}
            className="text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-40">
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  );
}
