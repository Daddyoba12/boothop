'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

const AIRPORT_GROUPS = [
  { label: 'London',  airports: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'], primary: 'LHR' },
  { label: 'Lagos',   airports: ['LOS'],                               primary: 'LOS' },
  { label: 'Kigali',  airports: ['KGL'],                               primary: 'KGL' },
  { label: 'Accra',   airports: ['ACC'],                               primary: 'ACC' },
  { label: 'Abuja',   airports: ['ABV'],                               primary: 'ABV' },
];

interface FeaturedEntry {
  origin: string; destination: string;
  originCity: string; destCity: string;
  priceGbp: number | null; airlineName: string | null;
  savingGbp: number | null; opportunityScore: number | null;
  recommendation: string | null;
}

function scoreColor(s: number) {
  if (s >= 70) return 'text-green-600';
  if (s >= 45) return 'text-yellow-600';
  return 'text-red-600';
}

function recommendationBadge(r: string) {
  if (r === 'BUY')  return 'bg-green-100 text-green-700 border-green-200';
  if (r === 'WAIT') return 'bg-red-100   text-red-700   border-red-200';
  return                   'bg-white     text-slate-600 border-slate-300';
}

export default function FlightsPage() {
  const [from, setFrom]       = useState('LHR');
  const [to, setTo]           = useState('LOS');
  const [date, setDate]       = useState('');
  const [featured, setFeatured] = useState<FeaturedEntry[]>([]);

  useEffect(() => {
    fetch('/api/bfi/featured')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.entries) setFeatured(d.entries); })
      .catch(() => {});

    // Default date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = `${from.toLowerCase()}-${to.toLowerCase()}`;
    const params = date ? `?date=${date}` : '';
    window.location.href = `/flights/${slug}${params}`;
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-white border-b border-slate-200 pt-32 pb-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-blue-600 text-sm font-medium uppercase tracking-widest mb-4">
            BootHop Flight Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-slate-900">
            Find the cheapest flights on your routes
          </h1>
          <p className="text-slate-600 text-lg mb-10">
            Real-time fares across multiple providers. Every click tracked. Every saving recorded.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white border border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch">
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {AIRPORT_GROUPS.map(g => (
                <option key={g.primary} value={g.primary}>{g.label} ({g.airports.join(', ')})</option>
              ))}
            </select>

            <button
              type="button"
              onClick={swap}
              className="md:w-10 text-slate-600 hover:text-slate-900 text-xl transition-colors"
              title="Swap"
            >
              ⇄
            </button>

            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {AIRPORT_GROUPS.map(g => (
                <option key={g.primary} value={g.primary}>{g.label} ({g.airports.join(', ')})</option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              Search →
            </button>
          </form>
        </div>
      </div>

      {/* Featured routes */}
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Today&apos;s Cheapest Flights</h2>
          <p className="text-xs text-slate-600">Updated every 4 hours · All prices in GBP</p>
        </div>

        {featured.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(entry => {
              const slug = `${entry.origin}-${entry.destination}`.toLowerCase();
              return (
                <Link
                  key={slug}
                  href={`/flights/${slug}`}
                  className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">{entry.originCity} → {entry.destCity}</p>
                      <p className="font-mono text-sm text-slate-600">{entry.origin} → {entry.destination}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${entry.recommendation ? recommendationBadge(entry.recommendation) : 'bg-white text-slate-400 border-slate-200'}`}>
                      {entry.recommendation ?? 'NO DATA'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {entry.priceGbp ? (
                        <>
                          <p className="text-3xl font-bold text-slate-900">£{entry.priceGbp.toFixed(0)}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{entry.airlineName ?? 'Multiple airlines'}</p>
                          {entry.savingGbp && entry.savingGbp > 0 && (
                            <p className="text-xs text-green-600 mt-1">↓ £{entry.savingGbp.toFixed(0)} vs yesterday</p>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-600 text-sm">No data yet</p>
                      )}
                    </div>
                    <div className="text-right">
                      {entry.opportunityScore !== null ? (
                        <>
                          <p className={`text-2xl font-bold ${scoreColor(entry.opportunityScore)}`}>
                            {entry.opportunityScore}
                          </p>
                          <p className="text-xs text-slate-600">score</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Score pending</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-blue-600 mt-4 group-hover:underline">
                    View all flights →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Airport hubs */}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-900">Explore Airport Hubs</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { code: 'LHR', city: 'London Heathrow' },
            { code: 'LGW', city: 'London Gatwick'  },
            { code: 'LOS', city: 'Lagos'            },
            { code: 'KGL', city: 'Kigali'           },
            { code: 'ACC', city: 'Accra'            },
            { code: 'ABV', city: 'Abuja'            },
          ].map(a => (
            <Link
              key={a.code}
              href={`/flights/airports/${a.code.toLowerCase()}`}
              className="flex items-center gap-2 bg-white hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm transition-all"
            >
              <span className="text-slate-600 font-mono text-xs">{a.code}</span>
              <span className="text-slate-900">{a.city}</span>
              <span className="text-blue-600">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-slate-200 bg-white/30 py-14 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-center mb-10">How BootHop Flight Intelligence works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { n: '1', title: 'We scan continuously', body: 'Multiple providers checked 5× daily across all monitored routes. No single source — full market coverage.' },
              { n: '2', title: 'We find the real cheapest', body: 'Results are merged and deduplicated across Kiwi, Amadeus, and other providers so you see the true market price.' },
              { n: '3', title: 'You click, we track', body: 'Every booking click is recorded. Over time this builds evidence of the traffic BootHop generates for airlines.' },
            ].map(step => (
              <div key={step.n}>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                  {step.n}
                </div>
                <p className="font-semibold mb-2">{step.title}</p>
                <p className="text-sm text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
