'use client';

import { useState } from 'react';

/**
 * Toggles between two role names on hover.
 *
 * <RoleToggle role="sender" />   →  "Sender" ↔ "Hooper"
 * <RoleToggle role="travel" />   →  "Traveller" ↔ "Booter"
 *
 * variant="badge"    pill badge (default)
 * variant="text"     plain inline — inherits parent styles
 * variant="heading"  plain inline, semibold hint
 */

type Role = 'sender' | 'travel';

const ROLE_MAP: Record<Role, [string, string]> = {
  sender: ['Sender',    'Hooper'],
  travel: ['Traveller', 'Booter'],
};

const BADGE_COLORS: Record<Role, string> = {
  sender: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
  travel: 'bg-blue-50    text-blue-700    border border-blue-200    hover:bg-blue-100',
};

interface Props {
  role: Role;
  variant?: 'badge' | 'text' | 'heading';
  /** When true, shows the alt name by default and toggles to primary on hover */
  invert?: boolean;
  className?: string;
}

export default function RoleToggle({ role, variant = 'badge', invert = false, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);
  const [primary, alt] = ROLE_MAP[role];
  const label = hovered ? (invert ? primary : alt) : (invert ? alt : primary);

  if (variant === 'badge') {
    return (
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full cursor-default select-none transition-all duration-200 ${BADGE_COLORS[role]} ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`cursor-default select-none transition-colors duration-200 ${className}`}
    >
      {label}
    </span>
  );
}
