'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { MissionControlData } from '@/lib/bfi/types';

function TodayClicks() {
  const [clicks, setClicks] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/bfi/analytics?period=today')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setClicks(d.todayClicks); })
      .catch(() => {});
  }, []);
  return <>{clicks ?? '—'}</>;
}

function StatCard({
  label, value, sub, color = 'text-slate-900',
}: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: 'green' | 'red' | 'yellow' | 'blue' }) {
  const map = {
    green:  'bg-green-100 text-green-600 border-green-200',
    red:    'bg-red-100   text-red-600   border-red-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    blue:   'bg-blue-100  text-blue-600  border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${map[color]}`}>
      {text}
    </span>
  );
}

export default function MissionControl() {
  const [data, setData]       = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bfi/dashboard');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function triggerScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res  = await fetch('/api/bfi/scan', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setScanResult(`Scan complete — ${json.offersFound} offers found across ${json.routesSearched} routes in ${(json.durationMs / 1000).toFixed(1)}s`);
        load();
      } else {
        setScanResult(`Scan failed: ${json.error}`);
      }
    } finally {
      setScanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-600">
        Loading Mission Control...
      </div>
    );
  }

  const d = data;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-slate-600 text-sm mt-1">BootHop Flight Intelligence — real-time route monitoring</p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {scanning ? 'Scanning...' : 'Run Scan Now'}
        </button>
      </div>

      {scanResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-600">
          {scanResult}
        </div>
      )}

      {/* AI Brief */}
      {d?.aiSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs text-blue-600 uppercase tracking-wider mb-2">Today&apos;s AI Brief</p>
          <p className="text-sm text-slate-700 leading-relaxed">{d.aiSummary}</p>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Flights Scanned"
          value={d?.flightsMonitored?.toLocaleString() ?? '0'}
          color="text-blue-600"
        />
        <StatCard
          label="Homepage Clicks"
          value={<TodayClicks />}
          color="text-green-600"
        />
        <StatCard
          label="Routes Healthy"
          value={d?.routesHealthy ?? 0}
          color="text-slate-700"
        />
        <StatCard
          label="Unread Alerts"
          value={d?.unreadAlerts ?? 0}
          color={d?.unreadAlerts ? 'text-yellow-600' : 'text-slate-600'}
        />
      </div>

      {/* Price highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {d?.cheapestOneway && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Cheapest One-Way Today</p>
            <p className="text-3xl font-bold text-slate-900">£{d.cheapestOneway.price.toFixed(0)}</p>
            <p className="text-sm text-slate-600 mt-1">{d.cheapestOneway.route}</p>
            <p className="text-xs text-slate-600 mt-0.5">{d.cheapestOneway.airline}</p>
          </div>
        )}

        {d?.biggestSavingGbp && (
          <div className="bg-white border border-green-200 rounded-xl p-5">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Biggest Saving Today</p>
            <p className="text-3xl font-bold text-green-600">£{d.biggestSavingGbp.toFixed(0)}</p>
            <p className="text-sm text-slate-600 mt-1">{d.biggestSavingRoute}</p>
            <p className="text-xs text-slate-600 mt-0.5">vs yesterday</p>
          </div>
        )}

        {d?.bestOpportunityRoute && (
          <div className="bg-white border border-blue-200 rounded-xl p-5">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Best Opportunity</p>
            <p className="text-3xl font-bold text-blue-600">{d.bestOpportunityScore}</p>
            <p className="text-sm text-slate-600 mt-1">{d.bestOpportunityRoute}</p>
            <p className="text-xs text-slate-600 mt-0.5">opportunity score / 100</p>
          </div>
        )}
      </div>

      {/* System health */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">System Health</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-600">Providers Online</p>
            <p className="text-lg font-semibold text-green-600 mt-0.5">{d?.providersOnline ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Providers Offline</p>
            <p className={`text-lg font-semibold mt-0.5 ${d?.providersOffline ? 'text-red-600' : 'text-slate-600'}`}>
              {d?.providersOffline ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Last Scan</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">
              {d?.lastScanAt
                ? new Date(d.lastScanAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Not yet run'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Avg Scan Time</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">
              {d?.avgScanMs ? `${(d.avgScanMs / 1000).toFixed(1)}s` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Sprint status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">Sprint 1 — Infrastructure</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            'Database schema', 'Airport table', 'Airline table', 'Route table',
            'Flight offers table', 'Search runs', 'Daily summaries', 'Route statistics',
            'Alerts engine', 'Provider architecture', 'Mock provider', 'Search engine',
            'Intelligence engine', 'Statistics engine', 'Admin dashboard', 'Mission Control',
            'Route manager', 'Scan logs', 'Alerts page', 'Flight ticker',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-slate-600">
              <span className="text-green-600">✓</span>
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
