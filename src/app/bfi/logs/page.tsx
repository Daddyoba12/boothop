'use client';

import { useState, useEffect } from 'react';
import type { BFISearchRun } from '@/lib/bfi/types';

function statusBadge(status: BFISearchRun['status']) {
  const map = {
    completed: 'bg-green-100 text-green-600 border-green-200',
    running:   'bg-blue-100  text-blue-600  border-blue-200',
    failed:    'bg-red-100   text-red-600   border-red-200',
  };
  return map[status];
}

export default function LogsPage() {
  const [runs, setRuns]       = useState<BFISearchRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/bfi/logs');
      if (res.ok) setRuns((await res.json()).runs ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Logs</h1>
        <p className="text-slate-600 text-sm mt-1">History of every scan run</p>
      </div>

      {loading ? (
        <div className="text-slate-600 text-sm">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-600 text-sm">
          No scans yet. Hit <strong>Run Scan Now</strong> on Mission Control to start.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Started</th>
                <th className="text-left px-5 py-3">Provider</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Routes</th>
                <th className="text-left px-5 py-3">Offers</th>
                <th className="text-left px-5 py-3">Duration</th>
                <th className="text-left px-5 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-100 transition-colors">
                  <td className="px-5 py-3 text-slate-600">
                    {new Date(r.started_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{r.provider}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r.routes_searched}</td>
                  <td className="px-5 py-3 text-slate-600">{r.offers_found.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="px-5 py-3 text-red-600 text-xs max-w-xs truncate">
                    {r.error ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
