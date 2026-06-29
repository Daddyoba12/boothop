'use client';

import Link from 'next/link';
import { useState } from 'react';

interface PipelineClient {
  id: string;
  company: string;
  slug: string;
  email: string | null;
  contact_name: string | null;
  plan: string | null;
  platforms: Record<string, boolean> | null;
  location: string | null;
  status: string;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵', instagram: '📸', linkedin: '💼',
  youtube: '▶️', telegram_channel: '✈️',
};

function PlatformBadges({ platforms }: { platforms: Record<string, boolean> | null }) {
  if (!platforms) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(platforms).filter(([, on]) => on).map(([k]) => (
        <span key={k} title={k} className="text-sm">{PLATFORM_ICONS[k] ?? '📡'}</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   'bg-green-500/15 text-green-400 border-green-500/25',
    pending:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
    paused:   'bg-gray-500/15 text-gray-400 border-gray-500/25',
    inactive: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

export default function PipelineAdminClient({ clients }: { clients: PipelineClient[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.company.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all:      clients.length,
    active:   clients.filter(c => c.status === 'active').length,
    pending:  clients.filter(c => c.status === 'pending').length,
    paused:   clients.filter(c => c.status === 'paused').length,
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.07] bg-[#07111f]/95 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-white/30 hover:text-white/60 transition-colors text-sm">← Admin</Link>
            <span className="text-white/15">/</span>
            <h1 className="text-base font-bold text-white">Pipeline Clients</h1>
            <span className="text-xs font-semibold text-white/30 bg-white/8 px-2 py-0.5 rounded-full">{counts.all}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/client-onboarding"
              className="text-xs bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg transition-colors"
            >
              + Onboard Client
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',   value: counts.all,     color: 'text-white' },
            { label: 'Active',  value: counts.active,  color: 'text-green-400' },
            { label: 'Pending', value: counts.pending, color: 'text-amber-400' },
            { label: 'Paused',  value: counts.paused,  color: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-lg p-1">
            {(['all', 'active', 'pending', 'paused'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                  filter === f ? 'bg-white/12 text-white' : 'text-white/35 hover:text-white/60'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search company, slug, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
          />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/25">
            {clients.length === 0 ? (
              <>
                <p className="text-4xl mb-4">📋</p>
                <p className="font-semibold text-white/40 mb-2">No pipeline clients yet</p>
                <p className="text-sm mb-6">Clients appear here once they complete the onboarding form.</p>
                <Link href="/client-onboarding" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
                  Onboard first client →
                </Link>
              </>
            ) : (
              <p>No clients match your search.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider">Company</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider hidden sm:table-cell">Slug / Login</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider hidden lg:table-cell">Platforms</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-white/30 uppercase tracking-wider hidden sm:table-cell">Onboarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{c.company}</p>
                      {c.location && <p className="text-[11px] text-white/30 mt-0.5">{c.location}</p>}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <code className="text-[11px] bg-white/5 px-2 py-0.5 rounded text-orange-300/80">{c.slug}</code>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-white/70">{c.contact_name ?? '—'}</p>
                      {c.email && <p className="text-[11px] text-white/30 mt-0.5">{c.email}</p>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <PlatformBadges platforms={c.platforms} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs capitalize text-white/50">{c.plan ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-[11px] text-white/30">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
