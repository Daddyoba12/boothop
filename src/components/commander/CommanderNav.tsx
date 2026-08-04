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
    <nav className="border-b border-gray-100 bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/commander/dashboard" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/boothop-icon-512.png" alt="" className="h-7 w-auto rounded-lg" />
            <div className="hidden sm:block leading-tight">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Pipeline</p>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-[0.1em]">Commander</p>
            </div>
          </Link>
          <span className="hidden sm:block text-gray-200 text-sm">/</span>
          <span className="hidden sm:block text-xs font-semibold text-gray-500 truncate max-w-[140px]">{company}</span>
          {isSuper && (
            <span className="hidden sm:block text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-wider">Admin</span>
          )}
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === href
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right: slug + logout */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] font-mono text-gray-300">{slug}</span>
          <button onClick={handleLogout} disabled={loggingOut}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 font-medium">
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  );
}
