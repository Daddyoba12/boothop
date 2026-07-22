'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, CheckCircle2,
  XCircle, RefreshCw, Search, Package, AlertTriangle,
} from 'lucide-react';

// ── Shipment compliance types ─────────────────────────────────────────────────
interface ItemDeclaration {
  id:                   string;
  declaration_status:   string;
  item_description:     string | null;
  item_category:        string | null;
  declared_value:       number | null;
  declared_currency:    string | null;
  declared_weight_kg:   number | null;
  contains_electronics: boolean;
  contains_medication:  boolean;
  contains_food:        boolean;
  contains_liquids:     boolean;
  contains_currency:    boolean;
  contains_jewellery:   boolean;
  contains_documents:   boolean;
  contains_clothing:    boolean;
  contains_hazardous:   boolean;
  contains_weapons:     boolean;
  risk_score:           number | null;
  submitted_at:         string | null;
  reviewed_at:          string | null;
  reviewed_by:          string | null;
  review_note:          string | null;
}

interface ShipmentMatch {
  id:                         string;
  status:                     string;
  sender_email:               string;
  traveler_email:             string;
  agreed_price:               number;
  compliance_locked_at:       string | null;
  compliance_review_started_at: string | null;
  sender_trip:                { from_city: string; to_city: string; travel_date: string } | null;
  item_declarations:          ItemDeclaration | null;
}

// ── Old item-level compliance types ──────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const riskColor = (score: number | null) => {
  if (!score) return 'text-slate-500 bg-slate-100';
  if (score >= 80) return 'text-red-600 bg-red-50';
  if (score >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
};

const statusPill = (status: string) => {
  const map: Record<string, string> = {
    locked_pending_compliance: 'bg-yellow-100 text-yellow-700',
    compliance_in_progress:    'bg-blue-100 text-blue-700',
    compliance_rejected:       'bg-red-100 text-red-700',
    compliance_timeout:        'bg-slate-100 text-slate-500',
  };
  return map[status] ?? 'bg-slate-100 text-slate-500';
};

const flags = (d: ItemDeclaration) =>
  Object.entries({
    electronics: d.contains_electronics,
    medication:  d.contains_medication,
    food:        d.contains_food,
    liquids:     d.contains_liquids,
    currency:    d.contains_currency,
    jewellery:   d.contains_jewellery,
    documents:   d.contains_documents,
    clothing:    d.contains_clothing,
    hazardous:   d.contains_hazardous,
    weapons:     d.contains_weapons,
  })
    .filter(([, v]) => v)
    .map(([k]) => k);

// ── Main component ────────────────────────────────────────────────────────────
type Tab = 'shipments' | 'items';

export default function ComplianceClient() {
  const [tab,      setTab]      = useState<Tab>('shipments');
  const [matches,  setMatches]  = useState<ShipmentMatch[]>([]);
  const [requests, setRequests] = useState<ComplianceRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [acting,   setActing]   = useState<string | null>(null);
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; msg: string } | null>(null);

  const loadShipments = async () => {
    const res  = await fetch('/api/admin/compliance/shipments');
    const data = await res.json();
    setMatches(Array.isArray(data) ? data : []);
  };

  const loadItems = async () => {
    const res  = await fetch('/api/admin/compliance');
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
  };

  const load = async () => {
    setLoading(true);
    try {
      await Promise.all([loadShipments(), loadItems()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decideShipment = async (matchId: string, decision: 'approve' | 'reject') => {
    setActing(matchId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/compliance/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, decision, note: noteMap[matchId] ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ id: matchId, msg: data.error ?? 'Failed' });
      } else {
        setFeedback({ id: matchId, msg: decision === 'approve' ? '✅ Approved — contacts released' : '❌ Rejected — sender refunded' });
        await loadShipments();
      }
    } finally {
      setActing(null);
    }
  };

  const decideItem = async (id: string, decision: 'approve' | 'reject') => {
    setActing(id);
    try {
      await fetch('/api/admin/compliance/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': '' },
        body:    JSON.stringify({ id, decision, note: noteMap[id] ?? '' }),
      });
      await loadItems();
    } finally {
      setActing(null);
    }
  };

  const pendingShipments = matches.filter((m) => m.status === 'compliance_in_progress');
  const pendingItems     = requests.filter((r) => !r.admin_decision);

  const filteredShipments = matches.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const t = Array.isArray(m.sender_trip) ? (m.sender_trip as any)[0] : m.sender_trip;
    return [m.sender_email, m.traveler_email, t?.from_city, t?.to_city,
            m.item_declarations?.item_description, m.item_declarations?.item_category]
      .some((v) => (v ?? '').toLowerCase().includes(q));
  });

  const filteredItems = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.item, r.country, r.category, r.profiles?.email ?? ''].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Compliance</h1>
            <p className="text-sm text-slate-500 mt-0.5">Shipment declarations and item checks</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">← Admin</Link>
            <button onClick={load} className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition">
              <RefreshCw className="h-4 w-4" />Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('shipments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'shipments' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="h-4 w-4" />
            Shipment Queue
            {pendingShipments.length > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {pendingShipments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'items' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Item Checks
            {pendingItems.length > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {pendingItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'shipments' ? 'Search by email, route, item…' : 'Search by item, country, user…'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : tab === 'shipments' ? (
          /* ── Shipment Queue ─────────────────────────────────────────────── */
          filteredShipments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No shipments in compliance queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((m) => {
                const trip   = Array.isArray(m.sender_trip) ? (m.sender_trip as any)[0] : m.sender_trip;
                const decl   = Array.isArray(m.item_declarations) ? (m.item_declarations as any)[0] : m.item_declarations;
                const itemFlags = decl ? flags(decl) : [];
                const isPending = m.status === 'compliance_in_progress';
                const fb = feedback?.id === m.id ? feedback.msg : null;

                return (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {trip?.from_city ?? '?'} → {trip?.to_city ?? '?'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {m.sender_email} · locked {m.compliance_locked_at ? new Date(m.compliance_locked_at).toLocaleString('en-GB') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {decl?.risk_score != null && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(decl.risk_score)}`}>
                            Risk {decl.risk_score}/100
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusPill(m.status)}`}>
                          {m.status.replace(/_/g, ' ')}
                        </span>
                        <Link
                          href={`/admin/compliance/${m.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Full review →
                        </Link>
                      </div>
                    </div>

                    {/* Declaration summary */}
                    {decl ? (
                      <div className="px-5 py-4 grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Item</p>
                          <p className="font-medium text-slate-800">{decl.item_description || '—'}</p>
                          <p className="text-xs text-slate-500">{decl.item_category || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Value / Weight</p>
                          <p className="font-medium text-slate-800">
                            {decl.declared_value != null ? `${decl.declared_currency ?? 'GBP'} ${decl.declared_value}` : '—'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {decl.declared_weight_kg != null ? `${decl.declared_weight_kg} kg` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Flags</p>
                          {itemFlags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {itemFlags.map((f) => (
                                <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  f === 'weapons' || f === 'hazardous'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>{f}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">None flagged</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-slate-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Awaiting declaration from sender
                      </div>
                    )}

                    {/* Feedback */}
                    {fb && (
                      <div className={`px-5 py-3 text-sm font-semibold border-t ${
                        fb.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-100' :
                        fb.startsWith('❌') ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {fb}
                      </div>
                    )}

                    {/* Actions */}
                    {isPending && decl && !fb && (
                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <input
                          type="text"
                          placeholder="Note (required for rejection)…"
                          value={noteMap[m.id] ?? ''}
                          onChange={(e) => setNoteMap((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="flex gap-2 shrink-0">
                          <button
                            disabled={acting === m.id}
                            onClick={() => decideShipment(m.id, 'approve')}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />Approve
                          </button>
                          <button
                            disabled={acting === m.id}
                            onClick={() => decideShipment(m.id, 'reject')}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Item Checks (legacy compliance_requests) ───────────────────── */
          filteredItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No item check requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((req) => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {req.status === 'PROHIBITED' ? <ShieldX className="h-4 w-4 text-red-500" /> :
                       req.status === 'RESTRICTED'  ? <ShieldAlert className="h-4 w-4 text-amber-500" /> :
                       <ShieldCheck className="h-4 w-4 text-green-500" />}
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">{req.item}</p>
                        <p className="text-xs text-slate-400">
                          {req.country} · {req.category} · {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(req.risk_score)}`}>
                        Risk {req.risk_score}/100
                      </span>
                      {req.admin_decision ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          req.admin_decision === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {req.admin_decision === 'APPROVED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {req.admin_decision}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          <Clock className="h-3.5 w-3.5" />Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4 grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">User</p>
                      <p className="font-medium text-slate-800">{req.profiles?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{req.profiles?.email ?? req.user_id}</p>
                    </div>
                    {req.admin_note && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Admin Note</p>
                        <p className="text-sm text-slate-700 italic">"{req.admin_note}"</p>
                      </div>
                    )}
                  </div>
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
                        <button disabled={acting === req.id} onClick={() => decideItem(req.id, 'approve')}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" />Approve
                        </button>
                        <button disabled={acting === req.id} onClick={() => decideItem(req.id, 'reject')}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50">
                          <XCircle className="h-4 w-4" />Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
