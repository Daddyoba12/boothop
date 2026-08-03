'use client';

import { useState } from 'react';

interface Client {
  id:              string;
  slug:            string;
  company:         string;
  email:           string | null;
  plan:            string | null;
  status:          string | null;
  created_at:      string;
  is_super_admin:  boolean;
  oracle_pipeline: string | null;
}

const planBadge: Record<string, string> = {
  basic: 'bg-slate-700 text-slate-200',
  pro:   'bg-amber-500/20 text-amber-300',
};

function PipelineCell({ client }: { client: Client }) {
  const [editing,  setEditing]  = useState(false);
  const [value,    setValue]    = useState(client.oracle_pipeline ?? '');
  const [saved,    setSaved]    = useState(client.oracle_pipeline ?? '');
  const [saving,   setSaving]   = useState(false);

  async function save() {
    if (value === saved) { setEditing(false); return; }
    setSaving(true);
    await fetch('/api/commander/clients', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ clientId: client.id, oraclePipeline: value }),
    });
    setSaved(value);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(saved); setEditing(false); } }}
          placeholder="e.g. otb_pipeline"
          className="text-xs font-mono bg-white/8 border border-orange-500/40 rounded px-2 py-1 text-white w-36 focus:outline-none"
        />
        <button onClick={save} disabled={saving}
          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40">
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => { setValue(saved); setEditing(false); }}
          className="text-[10px] text-white/30 hover:text-white/50">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {saved ? (
        <>
          <a
            href={`/videoEditor`}
            target="_blank"
            rel="noreferrer"
            title={`Open Oracle dashboard for ${saved}`}
            className="text-xs font-mono text-orange-300/80 hover:text-orange-300 transition-colors underline underline-offset-2"
          >
            {saved}
          </a>
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-[10px] text-white/30 hover:text-white/60 transition-all">
            edit
          </button>
        </>
      ) : (
        <button onClick={() => setEditing(true)}
          className="text-[10px] text-white/20 hover:text-orange-400 transition-colors italic">
          + link pipeline
        </button>
      )}
    </div>
  );
}

export default function SuperAdminClients({ clients }: { clients: Client[] }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Pipeline Clients</h2>
        <p className="text-[10px] text-white/25">{clients.length} account{clients.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="divide-y divide-white/5">
        {clients.length === 0 && (
          <p className="text-center py-12 text-white/25 text-sm">No clients yet.</p>
        )}
        {clients.map(c => (
          <div key={c.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors">
            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{c.company}</p>
                {c.is_super_admin && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 uppercase tracking-wider">Admin</span>
                )}
              </div>
              <p className="text-xs text-white/35 font-mono mt-0.5">{c.slug}</p>
              {c.email && <p className="text-xs text-white/25 mt-0.5 truncate">{c.email}</p>}
            </div>

            {/* Oracle pipeline link */}
            <div className="sm:w-48">
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-1">Oracle Pipeline</p>
              <PipelineCell client={c} />
            </div>

            {/* Badges */}
            <div className="shrink-0 flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${planBadge[c.plan ?? 'basic'] ?? planBadge.basic}`}>
                {c.plan ?? 'basic'}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {c.status ?? 'active'}
              </span>
              <span className="hidden sm:block text-[10px] text-white/20">
                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
