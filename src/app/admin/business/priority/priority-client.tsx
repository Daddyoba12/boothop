'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, Star, Phone, Mail,
  CheckCircle, Clock, ChevronDown, ChevronUp, Globe, Truck,
} from 'lucide-react';

type Partner = {
  id: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  job_title: string | null;
  industry_sector: string | null;
  delivery_type: string | null;
  delivery_frequency: string | null;
  typical_destinations: string | null;
  what_moving: string[] | null;
  annual_fee: number | null;
  discount_pct: number;
  response_hours: number;
  status: string;
  am_called_at: string | null;
  am_assigned: string | null;
  membership_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  payment_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  active:          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:        'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled:       'bg-white/10 text-white/40 border-white/10',
};

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPriorityPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/priority');
      if (res.ok) setPartners((await res.json()).partners ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setUpdating(id);
    try {
      await fetch('/api/admin/priority', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
      await load();
    } catch {}
    setUpdating(null);
  };

  const filtered = filter === 'all' ? partners : partners.filter(p => p.status === filter);

  const counts = {
    all:             partners.length,
    payment_pending: partners.filter(p => p.status === 'payment_pending').length,
    active:          partners.filter(p => p.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black">Boot<span className="text-amber-400">Hop</span></span>
          <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Priority Partners</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/business/carriers" className="text-xs text-white/30 hover:text-white">Carriers →</a>
          <a href="/admin/business/ops" className="text-xs text-white/30 hover:text-white">Ops →</a>
          <button onClick={load} disabled={loading} className="text-white/30 hover:text-white transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all',             label: 'All',             count: counts.all },
            { key: 'payment_pending', label: 'Awaiting payment', count: counts.payment_pending },
            { key: 'active',          label: 'Active',           count: counts.active },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === t.key ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-white/8 bg-white/3 text-white/50 hover:bg-white/5'}`}>
              {t.label} {t.count > 0 && <span className="ml-1 opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 text-amber-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/20">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No priority partner applications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const isOpen   = expanded === p.id;
              const fee      = p.annual_fee ?? 0;
              const isIntl   = p.delivery_type === 'international';
              const uncalled = p.status === 'payment_pending' && !p.am_called_at;

              return (
                <div key={p.id} className={`rounded-2xl border transition-all ${
                  uncalled                         ? 'border-red-500/30 bg-red-500/5' :
                  p.status === 'payment_pending'   ? 'border-amber-500/20 bg-amber-500/5' :
                  p.status === 'active'            ? 'border-emerald-500/15 bg-emerald-500/3' :
                  'border-white/8 bg-white/3'
                }`}>
                  <button className="w-full text-left px-6 py-4 flex items-start gap-4" onClick={() => setExpanded(isOpen ? null : p.id)}>
                    <div className="mt-1">
                      {isIntl ? <Globe className="h-4 w-4 text-amber-400" /> : <Truck className="h-4 w-4 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white">{p.company_name || p.email}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[p.status] ?? STATUS_COLORS.cancelled}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                        {uncalled && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">AM call needed</span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{p.job_title || '—'} · {p.industry_sector || '—'}</p>
                      <div className="flex items-center gap-4 mt-1">
                        {p.phone && <span className="text-white/30 text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                        <span className="text-white/30 text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-amber-400 font-black text-xl">£{fee.toLocaleString()}</p>
                      <p className="text-white/30 text-xs mt-0.5">{isIntl ? 'International' : 'UK'} · /yr</p>
                      <p className="text-white/20 text-xs mt-0.5">Applied {fmt(p.created_at)}</p>
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-white/20 ml-auto mt-1" /> : <ChevronDown className="h-3.5 w-3.5 text-white/20 ml-auto mt-1" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">
                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {[
                          { l: 'Delivery frequency',  v: p.delivery_frequency || '—' },
                          { l: 'Destinations',        v: p.typical_destinations || '—' },
                          { l: 'Cargo types',         v: Array.isArray(p.what_moving) && p.what_moving.length > 0 ? p.what_moving.join(', ') : '—' },
                          { l: 'Discount',            v: `${p.discount_pct}%` },
                          { l: 'Response SLA',        v: `${p.response_hours} hours` },
                          { l: 'AM called at',        v: fmt(p.am_called_at) },
                          { l: 'Account manager',     v: p.am_assigned || '—' },
                          { l: 'Membership expires',  v: fmt(p.membership_expires_at) },
                          { l: 'Last updated',        v: fmt(p.updated_at) },
                        ].map(f => (
                          <div key={f.l} className="bg-white/3 rounded-xl px-4 py-3">
                            <p className="text-white/30 text-xs mb-0.5">{f.l}</p>
                            <p className="text-white text-sm font-semibold">{f.v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap">
                        {p.status === 'payment_pending' && !p.am_called_at && (
                          <button onClick={() => patch(p.id, { am_called_at: new Date().toISOString() })} disabled={updating === p.id}
                            className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            {updating === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                            Mark AM called
                          </button>
                        )}
                        {p.status === 'payment_pending' && (
                          <button onClick={() => patch(p.id, {
                            status: 'active',
                            membership_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
                          })} disabled={updating === p.id}
                            className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            {updating === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Activate account
                          </button>
                        )}
                        {p.status === 'active' && (
                          <button onClick={() => patch(p.id, { status: 'payment_pending' })} disabled={updating === p.id}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/8 text-white/40 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            <Clock className="h-4 w-4" /> Suspend
                          </button>
                        )}
                        <a href={`tel:${p.phone}`} className={`flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 hover:text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all ${!p.phone ? 'pointer-events-none opacity-30' : ''}`}>
                          <Phone className="h-4 w-4" /> {p.phone || 'No phone'}
                        </a>
                        <a href={`mailto:${p.email}`} className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 hover:text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                          <Mail className="h-4 w-4" /> Email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
