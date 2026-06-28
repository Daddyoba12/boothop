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
          <p className="text-gray-500 text-sm mt-1">Performance across all monitored routes</p>
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 text-sm">
          {(['cheapest', 'clicks', 'rating'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${sort === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
          No airline data yet. Run a scan first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(a => (
            <div key={a.code} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{a.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{a.code}{a.alliance ? ` · ${a.alliance}` : ''}</p>
                </div>
                <span className="text-yellow-400 text-xs">{stars(a.rating)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                <div>
                  <p className="text-xs text-gray-500">Current Cheapest</p>
                  <p className="text-lg font-bold text-white">{a.cheapest ? `£${a.cheapest.toFixed(0)}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="text-lg font-bold text-gray-400">{a.average ? `£${a.average.toFixed(0)}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Baggage</p>
                  <p className="text-sm text-gray-300">{a.baggage_kg ? `${a.baggage_kg}kg` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Clicks</p>
                  <p className="text-sm text-blue-400 font-semibold">{a.clicks}</p>
                </div>
              </div>
              {a.routes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.routes.slice(0, 3).map(r => (
                    <span key={r} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">{r}</span>
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
