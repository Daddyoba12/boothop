'use client';

import { useState, useEffect } from 'react';

type RouteRow = {
  id: string;
  origin: string;
  destination: string;
  enabled: boolean;
  priority: number;
  scan_frequency_hours: number;
  tags: string[];
  stats?: {
    cheapest_airline_name: string | null;
    all_time_lowest_gbp: number | null;
    thirty_day_avg_gbp: number | null;
    opportunity_score: number;
    recommendation: string;
    trend: string;
  } | null;
};

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

function trendIcon(trend: string) {
  if (trend === 'falling') return '↓';
  if (trend === 'rising')  return '↑';
  return '→';
}

export default function RoutesPage() {
  const [routes, setRoutes]   = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/bfi/routes');
    if (res.ok) {
      const json = await res.json();
      setRoutes(json.routes ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, current: boolean) {
    setToggling(id);
    await fetch('/api/bfi/routes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, enabled: !current }),
    });
    await load();
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Route Manager</h1>
        <p className="text-gray-500 text-sm mt-1">Enable / disable routes and view per-route intelligence</p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading routes...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Route</th>
                <th className="text-left px-5 py-3">Cheapest Ever</th>
                <th className="text-left px-5 py-3">30d Avg</th>
                <th className="text-left px-5 py-3">Trend</th>
                <th className="text-left px-5 py-3">Score</th>
                <th className="text-left px-5 py-3">Signal</th>
                <th className="text-left px-5 py-3">Priority</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(r => {
                const st = Array.isArray(r.stats) ? r.stats[0] : r.stats;
                return (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-white">
                      {r.origin} → {r.destination}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {st?.all_time_lowest_gbp ? `£${st.all_time_lowest_gbp.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {st?.thirty_day_avg_gbp ? `£${st.thirty_day_avg_gbp.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {st?.trend ? trendIcon(st.trend) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${scoreColor(st?.opportunity_score ?? 50)}`}>
                        {st?.opportunity_score ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {st?.recommendation ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          st.recommendation === 'BUY'  ? 'bg-green-900/50 text-green-400' :
                          st.recommendation === 'WAIT' ? 'bg-red-900/50   text-red-400'   :
                                                         'bg-gray-800     text-gray-400'
                        }`}>{st.recommendation}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{r.priority}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggle(r.id, r.enabled)}
                        disabled={toggling === r.id}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          r.enabled
                            ? 'bg-green-900/50 text-green-400 border border-green-800 hover:bg-red-900/50 hover:text-red-400 hover:border-red-800'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-green-900/50 hover:text-green-400 hover:border-green-800'
                        }`}
                      >
                        {toggling === r.id ? '...' : r.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
