'use client';

import { useState, useEffect } from 'react';
import type { Report, ReportPeriod } from '@/lib/bfi/reports';

function signalColor(r: string) {
  if (r === 'BUY')  return 'text-green-400';
  if (r === 'WAIT') return 'text-red-400';
  return 'text-gray-400';
}

export default function ReportsPage() {
  const [period, setPeriod]   = useState<ReportPeriod>('daily');
  const [report, setReport]   = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bfi/reports?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setReport(d); })
      .finally(() => setLoading(false));
  }, [period]);

  function downloadCsv() {
    window.open(`/api/bfi/reports?period=${period}&format=csv`, '_blank');
  }

  const periods: ReportPeriod[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Flight intelligence performance by period</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                  period === p ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={downloadCsv}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 rounded-lg transition-colors"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Generating report...</div>
      ) : !report ? (
        <div className="text-gray-500 text-sm">No data available.</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Clicks',  value: report.totalClicks },
              { label: 'Total Views',   value: report.totalViews },
              { label: 'Total Offers',  value: report.totalOffers.toLocaleString() },
              { label: 'Biggest Drop',  value: report.biggestDrop ? `£${report.biggestDrop.toFixed(0)}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {report.topRoute && (
            <div className="flex gap-4 flex-wrap">
              <div className="bg-blue-950/30 border border-blue-900 rounded-xl px-5 py-3 text-sm">
                <span className="text-gray-500">Top Route: </span>
                <span className="text-white font-semibold font-mono">{report.topRoute}</span>
              </div>
              {report.topAirline && (
                <div className="bg-green-950/30 border border-green-900 rounded-xl px-5 py-3 text-sm">
                  <span className="text-gray-500">Top Airline: </span>
                  <span className="text-white font-semibold">{report.topAirline}</span>
                </div>
              )}
            </div>
          )}

          {/* Per-route breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Route</th>
                  <th className="text-left px-5 py-3">Cheapest</th>
                  <th className="text-left px-5 py-3">Avg</th>
                  <th className="text-left px-5 py-3">Biggest Drop</th>
                  <th className="text-left px-5 py-3">Offers</th>
                  <th className="text-left px-5 py-3">Views</th>
                  <th className="text-left px-5 py-3">Clicks</th>
                  <th className="text-left px-5 py-3">CTR</th>
                  <th className="text-left px-5 py-3">Signal</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map(r => (
                  <tr key={r.route} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                    <td className="px-5 py-3 font-mono font-semibold text-white">{r.route}</td>
                    <td className="px-5 py-3 text-gray-300">{r.cheapestGbp ? `£${r.cheapestGbp.toFixed(0)}` : '—'}</td>
                    <td className="px-5 py-3 text-gray-400">{r.averageGbp ? `£${r.averageGbp.toFixed(0)}` : '—'}</td>
                    <td className="px-5 py-3 text-green-400">{r.biggestDrop ? `£${r.biggestDrop.toFixed(0)}` : '—'}</td>
                    <td className="px-5 py-3 text-gray-400">{r.totalOffers.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-400">{r.views}</td>
                    <td className="px-5 py-3 text-blue-400 font-semibold">{r.clicks}</td>
                    <td className="px-5 py-3 text-gray-400">{r.ctr}%</td>
                    <td className={`px-5 py-3 font-semibold ${signalColor(r.recommendation)}`}>{r.recommendation}</td>
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
