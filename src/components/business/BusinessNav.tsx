'use client';

import Link from 'next/link';
import BootHopLogo from '@/components/BootHopLogo';

interface BusinessNavProps {
  /** Content rendered on the right side (links, buttons, email, logout) */
  rightSlot?: React.ReactNode;
  /** When true the nav has no bottom border — use this for overlaying a video */
  transparent?: boolean;
}

/**
 * Shared nav for every page under /business.
 * Uses the same BootHopLogo as the peer-to-peer side.
 * Always links back to /business.
 */
export function BusinessNav({ rightSlot, transparent = false }: BusinessNavProps) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-20 px-6 flex items-center justify-between ${
        transparent
          ? ''
          : 'border-b border-white/6 bg-[#020617]/90 backdrop-blur-xl'
      }`}
    >
      {/* Logo → /business */}
      <Link href="/business" className="flex items-center gap-4 shrink-0">
        <BootHopLogo size="md" />
        <span className="text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm">
          Business
        </span>
      </Link>

      {/* Right-side slot (nav links, user email, logout, etc.) */}
      {rightSlot && (
        <div className="flex items-center gap-3">{rightSlot}</div>
      )}
    </nav>
  );
}
