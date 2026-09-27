'use client';

import { useState, useEffect } from 'react';

interface AirlineRow {
  code:        string;
  name:        string;
  alliance:    string | null;
  baggage_kg:  number | null;
  rating:      number;
  cheapest:    number | null;
  average:     number | null;
  totalOffers: number;
  clicks:      number;
  routes:      string[];
}

function stars(r: number) {
  return '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
}

export default function AirlinesPage() {
  const [airlines, setAirlines] = useState<AirlineRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState<'cheapest' | 'clicks' | 'rating'>('cheapest');

  useEffect(() => {
    fetch('/api/bfi/airlines')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.airlines) setAirlines(d.airlines); })
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...airlines].sort((a, b) => {
    if (sort === 'cheapest') return (a.cheapest ?? 9999) - (b.cheapest ?? 9999);
    if (sort === 'clicks')   return b.clicks - a.clicks;
    return b.rating - a.rating;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Airline Intelligence</h1>
          <p className="text-slate-600 text-sm mt-1">Performance across all monitored routes</p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 text-sm">
          {(['cheapest', 'clicks', 'rating'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${sort === s ? 'bg-blue-500 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-600 text-sm">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-600 text-sm">
          No airline data yet. Run a scan first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(a => (
            <div key={a.code} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-600 font-mono">{a.code}{a.alliance ? ` · ${a.alliance}` : ''}</p>
                </div>
                <span className="text-yellow-600 text-xs">{stars(a.rating)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                <div>
                  <p className="text-xs text-slate-600">Current Cheapest</p>
                  <p className="text-lg font-bold text-slate-900">{a.cheapest ? `£${a.cheapest.toFixed(0)}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Average</p>
                  <p className="text-lg font-bold text-slate-600">{a.average ? `£${a.average.toFixed(0)}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Baggage</p>
                  <p className="text-sm text-slate-600">{a.baggage_kg ? `${a.baggage_kg}kg` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Clicks</p>
                  <p className="text-sm text-blue-600 font-semibold">{a.clicks}</p>
                </div>
              </div>
              {a.routes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.routes.slice(0, 3).map(r => (
                    <span key={r} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
