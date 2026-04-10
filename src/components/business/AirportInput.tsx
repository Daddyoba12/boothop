'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plane, X } from 'lucide-react';

export interface Airport {
  name: string;
  city: string;
  country: string;
  iata: string;
}

interface Props {
  label: string;
  value: string;
  onSelect: (display: string, airport: Airport) => void;
  onClear: () => void;
  placeholder?: string;
  disabledIata?: string; // prevent selecting same airport as other end
}

export function AirportInput({ label, value, onSelect, onClear, placeholder = 'City or IATA code…', disabledIata }: Props) {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value into the input when it changes
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}`);
        const data: Airport[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 200);
  }, []);

  const select = (airport: Airport) => {
    const display = `${airport.city} (${airport.iata})`;
    setQuery(display);
    setResults([]);
    setOpen(false);
    onSelect(display, airport);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onClear();
  };

  return (
    <div ref={containerRef} className="relative">
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="relative flex items-center">
        <Plane className="absolute left-3.5 h-4 w-4 text-white/30 pointer-events-none" />
        <input
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        {!loading && query && (
          <button type="button" onClick={clear} className="absolute right-3 text-white/25 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#0d1117] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          {results.map(a => {
            const disabled = disabledIata === a.iata;
            return (
              <button
                key={a.iata}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && select(a)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5'}`}
              >
                <span className="font-mono font-black text-emerald-400 text-xs w-9 shrink-0">{a.iata}</span>
                <div className="min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{a.city}</p>
                  <p className="text-xs text-white/35 truncate">{a.name} · {a.country}</p>
                </div>
                {disabled && <span className="text-xs text-white/25 ml-auto shrink-0">selected</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
