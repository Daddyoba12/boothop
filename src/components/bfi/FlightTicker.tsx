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

function trackFlightClick(entry: TickerEntry) {
  try {
    fetch('/api/bfi/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: entry.origin, destination: entry.destination, priceGbp: entry.priceGbp }),
    }).catch(() => {});
  } catch { /* non-blocking */ }
}

function TickerCard({ entry }: { entry: TickerEntry }) {
  const routeSlug = `${entry.origin}-${entry.destination}`.toLowerCase();
  const href      = entry.bookingUrl ?? `/flights/${routeSlug}`;
  return (
    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 min-w-[240px]">
      {/* Route + price */}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider leading-none mb-0.5">
          ✈ Cheap flight
        </p>
        <p className="text-[11px] text-white font-semibold leading-snug">
          {entry.originCity} → {entry.destinationCity} · <span className="text-green-400 font-bold">£{entry.priceGbp.toFixed(0)}</span>
        </p>
        <p className="text-[9px] text-gray-500 leading-none mt-0.5">{entry.airlineName} · {entry.recommendation}</p>
      </div>
      {/* CTA */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackFlightClick(entry)}
        className="shrink-0 text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-2.5 py-1.5 rounded-lg whitespace-nowrap"
      >
        Check available tickets
      </a>
    </div>
  );
}

interface FlightTickerProps {
  /** When true, renders as a fixed bar at the bottom of the viewport (news flash mode). */
  fixed?: boolean;
}

export default function FlightTicker({ fixed = false }: FlightTickerProps) {
  const [entries, setEntries]     = useState<TickerEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [paused, setPaused]       = useState(false);
  const [dismissed, setDismissed] = useState(false);
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

  if (!entries.length || dismissed) return null;

  const doubled = [...entries, ...entries];

  const inner = (
    <div
      className="relative overflow-hidden bg-gray-950 py-2.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left label + gradient fade */}
      {fixed && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="flex items-center gap-2 bg-blue-600 px-3 h-full shrink-0">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              ✈ Flights
            </span>
          </div>
          <div className="w-10 h-full bg-gradient-to-r from-gray-950 to-transparent" />
        </div>
      )}

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex gap-2.5 w-max"
        style={{
          paddingLeft: fixed ? '110px' : '0',
          animation: `bfi-scroll ${Math.max(30, entries.length * 8)}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((e, i) => (
          <TickerCard key={`${e.origin}-${e.destination}-${i}`} entry={e} />
        ))}
      </div>

      {/* Right: timestamp + dismiss (fixed mode only) */}
      {fixed && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gray-950 pl-2">
          {updatedAt && (
            <span className="text-[9px] text-gray-600 whitespace-nowrap hidden sm:block">
              Updated {new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss flight ticker"
            className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Right fade (inline mode) */}
      {!fixed && updatedAt && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-gray-950 pl-3">
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

  if (fixed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        {inner}
      </div>
    );
  }

  return (
    <div className="border-t border-b border-gray-800">
      {inner}
    </div>
  );
}
