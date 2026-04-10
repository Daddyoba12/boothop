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
      className={`px-6 py-4 flex items-center justify-between ${
        transparent ? '' : 'border-b border-white/6'
      }`}
    >
      {/* Logo → /business */}
      <Link href="/business" className="flex items-center gap-2 shrink-0">
        <BootHopLogo size="sm" iconClass="text-white" textClass="text-white" />
        <span className="text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
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
