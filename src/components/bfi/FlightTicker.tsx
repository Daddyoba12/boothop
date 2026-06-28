'use client';

import { useState, useEffect, useRef } from 'react';
import type { TickerEntry } from '@/lib/bfi/types';

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

function TickerCard({ entry }: { entry: TickerEntry }) {
  const isGood    = entry.opportunityScore >= 65;
  const routeSlug = `${entry.origin}-${entry.destination}`.toLowerCase();
  return (
    <a
      href={`/flights/${routeSlug}`}
      className="inline-flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-3 min-w-[240px] transition-colors"
    >
      <div>
        <p className="text-xs text-gray-400 font-medium">
          {entry.originCity} → {entry.destinationCity}
        </p>
        <p className="text-xl font-bold text-white">£{entry.priceGbp.toFixed(0)}</p>
        <p className="text-xs text-gray-500">{entry.airlineName}</p>
      </div>
      <div className="text-right">
        <Stars rating={entry.rating} />
        <p className={`text-xs font-medium mt-0.5 ${isGood ? 'text-green-400' : 'text-gray-400'}`}>
          {entry.recommendation}
        </p>
      </div>
    </a>
  );
}

export default function FlightTicker() {
  const [entries, setEntries]   = useState<TickerEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [paused, setPaused]     = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bfi/ticker')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.entries?.length) {
          setEntries(data.entries);
          setUpdatedAt(data.updatedAt);
        }
      })
      .catch(() => {});
  }, []);

  if (!entries.length) return null;

  // Duplicate for seamless loop
  const doubled = [...entries, ...entries];

  return (
    <div
      className="relative overflow-hidden bg-gray-950 border-t border-b border-gray-800 py-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex gap-3 w-max"
        style={{
          animation: `bfi-scroll 40s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((e, i) => (
          <TickerCard key={`${e.origin}-${e.destination}-${i}`} entry={e} />
        ))}
      </div>

      {updatedAt && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-gray-950 pl-3">
          Updated {new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <style>{`
        @keyframes bfi-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
