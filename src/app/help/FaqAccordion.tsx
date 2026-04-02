'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 pr-2 text-left text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-slate-400">{a}</p>}
    </div>
  );
}
