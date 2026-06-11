'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock,
  Truck, Zap, TrendingUp, Users, Star, ShieldAlert, ChevronDown, ChevronUp,
  Phone, Mail, Package, CircleDot,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type LiveJob = {
  id: string;
  reference: string;
  status: string;
  client_type: string;
  client_email: string;
  client_company: string | null;
  client_paid: number | null;
  partner_rate: number | null;
  boothop_margin: number | null;
  delivery_type: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  match_radius_miles: number;
  matched_at: string | null;
  assigned_at: string | null;
  is_boothop_direct: boolean;
  created_at: string;
};

type CertAlert = {
  id: string;
  email: string;
  company_name: string;
  cert_expiry_date: string | null;
  insurance_expiry_date: string | null;
  status_active: boolean;
};

type SLABreach = {
  id: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  job_title: string | null;
  annual_fee: number | null;
  created_at: string;
  am_called_at: string | null;
};

type Application = {
  id: string;
  company_name: string | null;
  email: string;
  annual_fee?: number | null;
  delivery_type?: string | null;
  created_at: string;
  registration_fee_paid?: boolean;
  am_called_at?: string | null;
};

type OpsData = {
  live_jobs: LiveJob[];
  today: {
    total: number;
    delivered: number;
    revenue: number;
    margin: number;
    payout: number;
    partner_count: number;
    direct_count: number;
  };
  cert_critical: CertAlert[];
  cert_warning: CertAlert[];
  sla_breaches: SLABreach[];
  carrier_applications: Application[];
  priority_applications: Application[];
  active_carriers: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function minsAgo(ts: string) {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
}

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Status config ─────────────────────────────────────────────────────────────

const JOB_STATUS: Record<string, { label: string; dot: string }> = {
  received:   { label: 'Received',   dot: 'bg-amber-400' },
  matching:   { label: 'Matching',   dot: 'bg-blue-400 animate-pulse' },
  assigned:   { label: 'Assigned',   dot: 'bg-purple-400' },
  collected:  { label: 'Collected',  dot: 'bg-indigo-400' },
  in_transit: { label: 'In transit', dot: 'bg-cyan-400' },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Live job row ──────────────────────────────────────────────────────────────

function LiveJobRow({ job }: { job: LiveJob }) {
  const [open, setOpen] = useState(false);
  const mins     = minsAgo(job.matched_at ?? job.created_at);
  const isUrgent = (job.status === 'matching' || job.status === 'received') && mins >= 15;
  const cfg      = JOB_STATUS[job.status] ?? { label: job.status, dot: 'bg-white/30' };

  return (
    <div className={`rounded-2xl border transition-all ${
      isUrgent          ? 'border-red-500/40 bg-red-500/5' :
      job.is_boothop_direct ? 'border-orange-500/30 bg-orange-500/5' :
      job.status === 'matching' ? 'border-blue-500/20 bg-blue-500/5' :
      'border-white/8 bg-white/3'
    }`}>
      <button className="w-full text-left px-5 py-4 flex items-start gap-4" onClick={() => setOpen(o => !o)}>
        {/* Status dot */}
        <div className="mt-1">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-white font-bold text-sm">{job.reference}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'
            }`}>{cfg.label}</span>
            {job.is_boothop_direct && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">BootHop Direct</span>
            )}
            {job.client_type === 'priority' && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                <Star className="inline h-2.5 w-2.5 mb-0.5" /> Priority
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm truncate">
            {job.pickup_address?.split(',').slice(-2).join(',').trim() || '—'}
            <span className="text-white/20 mx-2">→</span>
            {job.delivery_address?.split(',').slice(-2).join(',').trim() || '—'}
          </div>
          <div className="text-white/30 text-xs mt-0.5">{job.client_email}</div>
        </div>

        <div className="shrink-0 text-right">
          {job.partner_rate != null && (
            <p className="text-emerald-400 font-black text-lg">£{job.partner_rate.toLocaleString()}</p>
          )}
          <p className={`text-xs font-bold mt-0.5 ${isUrgent ? 'text-red-400' : 'text-white/30'}`}>
            {mins} min{mins !== 1 ? 's' : ''} ago
          </p>
          <p className="text-white/20 text-xs mt-0.5">{job.match_radius_miles}mi radius</p>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-white/20 ml-auto mt-1" /> : <ChevronDown className="h-3.5 w-3.5 text-white/20 ml-auto mt-1" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { l: 'Client',     v: job.client_company || job.client_email },
              { l: 'Type',       v: job.delivery_type === 'uk' ? 'UK' : 'International' },
              { l: 'Client paid', v: job.client_paid ? `£${job.client_paid.toLocaleString()}` : '—' },
              { l: 'Partner rate', v: job.partner_rate ? `£${job.partner_rate.toLocaleString()} (70%)` : '—' },
              { l: 'Pickup',     v: job.pickup_address || '—' },
              { l: 'Delivery',   v: job.delivery_address || '—' },
              { l: 'Matched at', v: fmt(job.matched_at) },
              { l: 'Assigned at', v: fmt(job.assigned_at) },
            ].map(f => (
              <div key={f.l} className="bg-white/3 rounded-xl px-3 py-2.5">
                <p className="text-white/30 text-xs mb-0.5">{f.l}</p>
                <p className="text-white text-xs font-semibold">{f.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function OpsPage() {
  const [data,     setData]     = useState<OpsData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ops');
      if (res.ok) {
        setData(await res.json());
        setLastFetch(new Date());
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const urgent = data?.live_jobs.filter(j =>
    (j.status === 'matching' || j.status === 'received') && minsAgo(j.matched_at ?? j.created_at) >= 10
  ) ?? [];

  const today = data?.today;
  const partnerPct = today && today.delivered > 0
    ? Math.round((today.partner_count / today.delivered) * 100)
    : 0;
  const directPct = today && today.delivered > 0
    ? Math.round((today.direct_count / today.delivered) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#020617]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black">Boot<span className="text-blue-400">Hop</span></span>
          <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Ops Dashboard</span>
          {urgent.length > 0 && (
            <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full animate-pulse">
              {urgent.length} URGENT
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-white/20 text-xs">Updated {fmt(lastFetch.toISOString())}</span>
          )}
          <button onClick={load} disabled={loading} className="text-white/30 hover:text-white transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="/admin/business/carriers" className="text-xs text-white/30 hover:text-white transition-colors">Carriers →</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {loading && !data ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── SLA Breaches (critical) ─────────────────────────────────── */}
            {(data?.sla_breaches?.length ?? 0) > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <h2 className="font-black text-red-400 uppercase tracking-widest text-sm">
                    SLA Breach — AM call overdue ({data?.sla_breaches.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {data?.sla_breaches.map(s => (
                    <div key={s.id} className="border border-red-500/40 bg-red-500/8 rounded-2xl px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">{s.company_name || s.email}</p>
                          <p className="text-white/50 text-sm">{s.job_title || '—'} · {s.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            {s.phone && (
                              <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-red-400 font-bold text-sm hover:text-red-300">
                                <Phone className="h-3.5 w-3.5" /> {s.phone}
                              </a>
                            )}
                            <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-white/40 text-sm hover:text-white">
                              <Mail className="h-3.5 w-3.5" /> {s.email}
                            </a>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-amber-400 font-black text-lg">£{(s.annual_fee ?? 0).toLocaleString()}/yr</p>
                          <p className="text-red-400 font-bold text-sm">{minsAgo(s.created_at)} mins waiting</p>
                          <p className="text-white/30 text-xs">Applied {fmt(s.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Today's stats ───────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Today</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <StatCard label="Jobs in" value={String(today?.total ?? 0)} />
                <StatCard label="Delivered" value={String(today?.delivered ?? 0)} accent="text-emerald-400" />
                <StatCard
                  label="Partner matched"
                  value={`${today?.partner_count ?? 0}`}
                  sub={today?.delivered ? `${partnerPct}%` : undefined}
                  accent="text-blue-400"
                />
                <StatCard
                  label="BootHop direct"
                  value={`${today?.direct_count ?? 0}`}
                  sub={today?.delivered ? `${directPct}%` : undefined}
                  accent="text-orange-400"
                />
                <StatCard label="Revenue" value={today?.revenue ? `£${today.revenue.toLocaleString()}` : '£0'} accent="text-emerald-400" />
                <StatCard label="Margin (30%)" value={today?.margin ? `£${today.margin.toLocaleString()}` : '£0'} accent="text-emerald-300" />
                <StatCard label="Active partners" value={String(data?.active_carriers ?? 0)} accent="text-blue-300" />
              </div>
            </section>

            {/* ── Live jobs ────────────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">
                Live jobs ({data?.live_jobs.length ?? 0})
              </h2>
              {!data?.live_jobs.length ? (
                <div className="text-center py-12 border border-white/8 rounded-2xl text-white/20">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No active jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.live_jobs.map(j => <LiveJobRow key={j.id} job={j} />)}
                </div>
              )}
            </section>

            {/* ── Pending applications ─────────────────────────────────────── */}
            {((data?.carrier_applications.length ?? 0) + (data?.priority_applications.length ?? 0)) > 0 && (
              <section>
                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Pending applications</h2>
                <div className="grid md:grid-cols-2 gap-6">

                  {/* Carrier applications */}
                  {(data?.carrier_applications.length ?? 0) > 0 && (
                    <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Truck className="h-4 w-4 text-blue-400" />
                        <h3 className="font-bold text-blue-400 text-sm">Carrier applications ({data?.carrier_applications.length})</h3>
                        <a href="/admin/business/carriers?status=payment_pending" className="ml-auto text-xs text-white/30 hover:text-white">View all →</a>
                      </div>
                      <div className="space-y-2">
                        {data?.carrier_applications.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div>
                              <p className="text-white text-sm font-semibold">{a.company_name || a.email}</p>
                              <p className="text-white/30 text-xs">{fmtDate(a.created_at)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.registration_fee_paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {a.registration_fee_paid ? '£250 paid' : '£250 pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority applications */}
                  {(data?.priority_applications.length ?? 0) > 0 && (
                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-amber-400" />
                        <h3 className="font-bold text-amber-400 text-sm">Priority applications ({data?.priority_applications.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {data?.priority_applications.slice(0, 5).map(a => (
                          <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div>
                              <p className="text-white text-sm font-semibold">{a.company_name || a.email}</p>
                              <p className="text-white/30 text-xs">
                                {a.delivery_type === 'international' ? 'International' : 'UK'} · {fmtDate(a.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-amber-400 font-bold text-sm">£{(a.annual_fee ?? 0).toLocaleString()}/yr</p>
                              <span className={`text-xs font-bold ${a.am_called_at ? 'text-emerald-400' : 'text-red-400'}`}>
                                {a.am_called_at ? 'AM called' : 'AM pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Partner cert alerts ──────────────────────────────────────── */}
            {((data?.cert_critical.length ?? 0) + (data?.cert_warning.length ?? 0)) > 0 && (
              <section>
                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Partner certification alerts</h2>
                <div className="space-y-2">
                  {data?.cert_critical.map(c => (
                    <div key={c.id} className="border border-red-500/30 bg-red-500/5 rounded-xl px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">{c.company_name}</p>
                        <p className="text-white/40 text-xs">{c.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-bold text-sm">Critical — expires within 7 days</span>
                        </div>
                        <p className="text-white/30 text-xs">
                          {c.cert_expiry_date && `Cert: ${fmtDate(c.cert_expiry_date)}`}
                          {c.cert_expiry_date && c.insurance_expiry_date && ' · '}
                          {c.insurance_expiry_date && `Insurance: ${fmtDate(c.insurance_expiry_date)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data?.cert_warning.map(c => (
                    <div key={c.id} className="border border-amber-500/20 bg-amber-500/5 rounded-xl px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">{c.company_name}</p>
                        <p className="text-white/40 text-xs">{c.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-400 font-bold text-sm">Expires within 30 days</span>
                        </div>
                        <p className="text-white/30 text-xs">
                          {c.cert_expiry_date && `Cert: ${fmtDate(c.cert_expiry_date)}`}
                          {c.cert_expiry_date && c.insurance_expiry_date && ' · '}
                          {c.insurance_expiry_date && `Insurance: ${fmtDate(c.insurance_expiry_date)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className="text-center text-white/10 text-xs py-4 border-t border-white/5">
              BootHop Ops Dashboard · Auto-refreshes every 60 seconds · {new Date().toLocaleDateString('en-GB')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
