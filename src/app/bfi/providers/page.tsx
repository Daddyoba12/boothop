'use client';

import { useState, useEffect } from 'react';

interface ProviderRow {
  provider:        string;
  status:          string;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error:      string | null;
  success_count:   number;
  error_count:     number;
  avg_latency_ms:  number | null;
}

function statusDot(s: string) {
  if (s === 'online')   return 'bg-green-500';
  if (s === 'degraded') return 'bg-yellow-500';
  if (s === 'offline')  return 'bg-red-500';
  return 'bg-gray-600';
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    online:   'text-green-400',
    degraded: 'text-yellow-400',
    offline:  'text-red-400',
    unknown:  'text-gray-500',
  };
  return map[s] ?? 'text-gray-500';
}

const PROVIDER_INFO: Record<string, { name: string; desc: string; cost: string; docs: string }> = {
  kiwi:    { name: 'Kiwi Tequila',     desc: 'Primary — broad coverage, affiliate links, free',  cost: '$0',        docs: 'tequila.kiwi.com' },
  amadeus: { name: 'Amadeus',          desc: 'Secondary — airline-direct fares, free tier',       cost: '$0–$200/mo', docs: 'developers.amadeus.com' },
  mock:    { name: 'Mock Provider',    desc: 'Development fallback — realistic generated data',   cost: '$0',        docs: 'internal' },
  opensky: { name: 'OpenSky Network',  desc: 'Flight status & departure verification',            cost: '$0',        docs: 'opensky-network.org' },
};

export default function ProvidersPage() {
  const [rows, setRows]       = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bfi/provider-status')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.providers) setRows(d.providers); })
      .finally(() => setLoading(false));
  }, []);

  function fmt(s: string | null) {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <p className="text-gray-500 text-sm mt-1">Health status of all flight data providers</p>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PROVIDER_INFO).map(([key, info]) => {
          const row = rows.find(r => r.provider === key);
          const status = row?.status ?? 'unknown';
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDot(status)}`} />
                    <p className="font-semibold text-white">{info.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                </div>
                <span className={`text-xs font-semibold capitalize ${statusLabel(status)}`}>
                  {status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-3">
                <span className="text-gray-600">Cost</span>
                <span className="text-gray-300">{info.cost}</span>
                <span className="text-gray-600">Docs</span>
                <span className="text-gray-400">{info.docs}</span>
                <span className="text-gray-600">Last checked</span>
                <span className="text-gray-400">{fmt(row?.last_checked_at ?? null)}</span>
                <span className="text-gray-600">Avg latency</span>
                <span className="text-gray-400">{row?.avg_latency_ms ? `${row.avg_latency_ms}ms` : '—'}</span>
                {row?.last_error && (
                  <>
                    <span className="text-gray-600">Last error</span>
                    <span className="text-red-400 truncate max-w-[180px]">{row.last_error}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activation guide */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Activation Checklist</p>
        <div className="space-y-3 text-sm">
          {[
            { key: 'KIWI_API_KEY',             label: 'Kiwi Tequila',   hint: 'Get free key at tequila.kiwi.com — activates primary provider + affiliate links' },
            { key: 'KIWI_PARTNER_ID',          label: 'Kiwi Partner ID', hint: 'Optional — needed to earn affiliate commission on bookings' },
            { key: 'AMADEUS_CLIENT_ID',        label: 'Amadeus Key',    hint: 'Get free at developers.amadeus.com — activates secondary provider' },
            { key: 'AMADEUS_CLIENT_SECRET',    label: 'Amadeus Secret', hint: 'Pair with client ID' },
            { key: 'AMADEUS_ENV',              label: 'Amadeus Env',    hint: 'Set to "production" when moving off test environment' },
          ].map(item => {
            const active = rows.some(r =>
              (item.key.startsWith('KIWI')    && r.provider === 'kiwi'    && r.status === 'online') ||
              (item.key.startsWith('AMADEUS') && r.provider === 'amadeus' && r.status === 'online')
            );
            return (
              <div key={item.key} className="flex items-start gap-3">
                <span className={`mt-0.5 text-base ${active ? 'text-green-400' : 'text-gray-700'}`}>
                  {active ? '✓' : '○'}
                </span>
                <div>
                  <p className="text-gray-200">
                    <code className="text-blue-400 text-xs bg-blue-950/30 px-1.5 py-0.5 rounded">{item.key}</code>
                    {' '}{item.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw table */}
      {!loading && rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-5 py-4 border-b border-gray-800">Live Status</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-600 border-b border-gray-800">
                <th className="text-left px-5 py-2">Provider</th>
                <th className="text-left px-5 py-2">Status</th>
                <th className="text-left px-5 py-2">Last Success</th>
                <th className="text-left px-5 py-2">Latency</th>
                <th className="text-left px-5 py-2">Errors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.provider} className="border-b border-gray-800/40">
                  <td className="px-5 py-3 font-mono text-gray-300">{r.provider}</td>
                  <td className="px-5 py-3">
                    <span className={`capitalize font-medium text-xs ${statusLabel(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{fmt(r.last_success_at)}</td>
                  <td className="px-5 py-3 text-gray-400">{r.avg_latency_ms ? `${r.avg_latency_ms}ms` : '—'}</td>
                  <td className="px-5 py-3 text-red-400">{r.error_count || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
