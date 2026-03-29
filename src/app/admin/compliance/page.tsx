'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, CheckCircle2,
  XCircle, RefreshCw, Search, Filter,
} from 'lucide-react';

interface ComplianceRequest {
  id:             string;
  item:           string;
  country:        string;
  status:         string;
  category:       string;
  risk_score:     number;
  action:         string;
  admin_decision: string | null;
  admin_note:     string | null;
  created_at:     string;
  user_id:        string;
  profiles:       { full_name: string | null; email: string | null } | null;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const statusIcon = (status: string) => {
  if (status === 'PROHIBITED') return <ShieldX  className="h-4 w-4 text-red-500" />;
  if (status === 'RESTRICTED')  return <ShieldAlert className="h-4 w-4 text-amber-500" />;
  return <ShieldCheck className="h-4 w-4 text-green-500" />;
};

const riskColor = (score: number) =>
  score >= 80 ? 'text-red-600 bg-red-50' :
  score >= 50 ? 'text-amber-600 bg-amber-50' :
                'text-green-600 bg-green-50';

export default function AdminCompliancePage() {
  const [requests, setRequests] = useState<ComplianceRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterTab>('pending');
  const [search,   setSearch]   = useState('');
  const [acting,   setActing]   = useState<string | null>(null);
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/compliance');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setActing(id);
    try {
      await fetch('/api/admin/compliance/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, note: noteMap[id] ?? '' }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesTab =
      filter === 'all'      ? true :
      filter === 'pending'  ? !r.admin_decision :
      filter === 'approved' ? r.admin_decision === 'APPROVED' :
                              r.admin_decision === 'REJECTED';

    const q = search.toLowerCase();
    const matchesSearch = !q || [r.item, r.country, r.category, r.profiles?.email ?? '', r.profiles?.full_name ?? '']
      .some((v) => v.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => !r.admin_decision).length,
    approved: requests.filter((r) => r.admin_decision === 'APPROVED').length,
    rejected: requests.filter((r) => r.admin_decision === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Compliance Queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review flagged shipment requests</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'all',      label: 'Total',    color: 'text-slate-700',  bg: 'bg-white' },
            { key: 'pending',  label: 'Pending',  color: 'text-amber-700',  bg: 'bg-amber-50' },
            { key: 'approved', label: 'Approved', color: 'text-green-700',  bg: 'bg-green-50' },
            { key: 'rejected', label: 'Rejected', color: 'text-red-700',    bg: 'bg-red-50' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as FilterTab)}
              className={`${s.bg} rounded-2xl p-4 border text-left transition hover:ring-2 hover:ring-blue-200 ${
                filter === s.key ? 'ring-2 ring-blue-500' : 'border-slate-200'
              }`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key as FilterTab]}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, country, user…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Filter className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No requests match this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {statusIcon(req.status)}
                    <div>
                      <p className="font-semibold text-slate-900 capitalize">{req.item}</p>
                      <p className="text-xs text-slate-400">
                        {req.country} · {req.category} · {new Date(req.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(req.risk_score)}`}>
                      Risk {req.risk_score}/100
                    </span>
                    {req.admin_decision ? (
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        req.admin_decision === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {req.admin_decision === 'APPROVED'
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : <XCircle className="h-3.5 w-3.5" />}
                        {req.admin_decision}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">User</p>
                    <p className="text-sm font-medium text-slate-800">
                      {req.profiles?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">{req.profiles?.email ?? req.user_id}</p>
                  </div>

                  {req.admin_note && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Admin Note</p>
                      <p className="text-sm text-slate-700 italic">"{req.admin_note}"</p>
                    </div>
                  )}
                </div>

                {/* Actions — only show if no decision yet */}
                {!req.admin_decision && (
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      type="text"
                      placeholder="Optional note…"
                      value={noteMap[req.id] ?? ''}
                      onChange={(e) => setNoteMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={acting === req.id}
                        onClick={() => decide(req.id, 'approve')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        disabled={acting === req.id}
                        onClick={() => decide(req.id, 'reject')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
