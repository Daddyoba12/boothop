'use client';

import { useState, useEffect } from 'react';
import type { BFIAlert } from '@/lib/bfi/types';

function severityStyle(s: BFIAlert['severity']) {
  const map = {
    success:  'border-l-green-500  bg-green-950/30  text-green-300',
    info:     'border-l-blue-500   bg-blue-950/30   text-blue-300',
    warning:  'border-l-yellow-500 bg-yellow-950/30 text-yellow-300',
    critical: 'border-l-red-500    bg-red-950/30    text-red-300',
  };
  return map[s] ?? map.info;
}

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<BFIAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/bfi/alerts?limit=100');
    if (res.ok) setAlerts((await res.json()).alerts ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await fetch('/api/bfi/alerts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ markAll: true }),
    });
    load();
  }

  const unread = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Price drops, lowest-ever fares, and system events</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-gray-400 hover:text-white underline underline-offset-2"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
          No alerts yet. Alerts are generated automatically after each scan.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div
              key={a.id}
              className={`border-l-4 rounded-r-xl px-5 py-4 ${severityStyle(a.severity)} ${a.read ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-sm mt-0.5 opacity-80">{a.message}</p>
                </div>
                <p className="text-xs opacity-60 whitespace-nowrap shrink-0">
                  {new Date(a.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
