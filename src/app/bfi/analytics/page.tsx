'use client';

import { useState, useEffect } from 'react';

type Period = 'today' | 'week' | 'month';

interface AnalyticsData {
  totalClicks:   number;
  todayClicks:   number;
  todayViews:    number;
  overallCtr:    number;
  topAirline:    string | null;
  topRoute:      string | null;
  topCountry:    string | null;
  byRoute:       Array<{ route: string; clicks: number; ctr: number }>;
  byAirline:     Array<{ airline: string; clicks: number }>;
  recent:        Array<{ origin: string; destination: string; airline: string; price: number; device: string | null; clicked_at: string }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod]   = useState<Period>('today');
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bfi/analytics?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [period]);

  const periods: Period[] = ['today', 'week', 'month'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Click Intelligence</h1>
          <p className="text-slate-600 text-sm mt-1">Every outbound click tracked by BootHop</p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                period === p ? 'bg-blue-500 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-600 text-sm">Loading analytics...</div>
      ) : !data ? (
        <div className="text-slate-600 text-sm">No data yet.</div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Today's Clicks", value: data.todayClicks, color: 'text-blue-600' },
              { label: "Today's Views",  value: data.todayViews,  color: 'text-slate-700' },
              { label: 'Click-Through Rate', value: `${data.overallCtr}%`, color: 'text-green-600' },
              { label: 'Top Country', value: data.topCountry ?? '—', color: 'text-slate-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">Clicks by Route</p>
              <div className="space-y-3">
                {data.byRoute.length === 0 ? (
                  <p className="text-slate-600 text-sm">No clicks yet</p>
                ) : data.byRoute.map(r => (
                  <div key={r.route} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-mono">{r.route}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (r.clicks / Math.max(...data.byRoute.map(x => x.clicks))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-900 w-6 text-right">{r.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">Clicks by Airline</p>
              <div className="space-y-3">
                {data.byAirline.length === 0 ? (
                  <p className="text-slate-600 text-sm">No clicks yet</p>
                ) : data.byAirline.map(a => (
                  <div key={a.airline} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{a.airline}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (a.clicks / Math.max(...data.byAirline.map(x => x.clicks))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-900 w-6 text-right">{a.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent clicks */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <p className="text-xs text-slate-600 uppercase tracking-wider px-5 py-4 border-b border-slate-200">Recent Clicks</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-600 border-b border-slate-200">
                  <th className="text-left px-5 py-2">Route</th>
                  <th className="text-left px-5 py-2">Airline</th>
                  <th className="text-left px-5 py-2">Price</th>
                  <th className="text-left px-5 py-2">Device</th>
                  <th className="text-left px-5 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-600">No clicks yet</td></tr>
                ) : data.recent.map((c, i) => (
                  <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-600">{c.origin} → {c.destination}</td>
                    <td className="px-5 py-3 text-slate-600">{c.airline}</td>
                    <td className="px-5 py-3 text-slate-900 font-semibold">£{c.price.toFixed(0)}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{c.device ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(c.clicked_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
