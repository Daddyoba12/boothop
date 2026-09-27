'use client';

import { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Google Places address autocomplete.
 * Falls back to a plain text input if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set
 * or if the Maps script hasn't loaded yet.
 */
export function PlacesInput({ label, value, onChange, placeholder = 'Enter address or postcode', className }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const acRef       = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);

  // Poll until Google Maps Places library is available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    let attempts = 0;
    const check = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        setReady(true);
      } else if (attempts++ < 30) {
        setTimeout(check, 300);
      }
    };
    check();
  }, []);

  // Initialise Autocomplete once the library is ready
  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address'],
    });

    acRef.current.addListener('place_changed', () => {
      const place = acRef.current?.getPlace();
      const addr  = place?.formatted_address;
      if (addr) onChange(addr);
    });
  }, [ready, onChange]);

  // Keep uncontrolled input in sync with external value resets (e.g. draft restore)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}</p>
      )}
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
        <input
          ref={inputRef}
          defaultValue={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-colors"
        />
      </div>
      {ready && (
        <p className="text-[10px] text-slate-300 mt-1 ml-1">Powered by Google Maps</p>
      )}
    </div>
  );
}
