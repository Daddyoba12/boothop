'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2, RefreshCw, Package, MapPin, Clock,
  CheckCircle, Truck, AlertCircle, XCircle, User,
  Phone, Mail, ChevronDown, ChevronUp,
} from 'lucide-react';

type Job = {
  id: string;
  job_ref: string;
  email: string;
  pickup: string;
  dropoff: string;
  description: string | null;
  weight: string | null;
  declared_value: string | null;
  category: string | null;
  urgency: string;
  insurance: boolean;
  estimated_price: number | null;
  miles: number | null;
  status: string;
  driver_name: string | null;
  driver_email: string | null;
  driver_phone: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; next: string | null }> = {
  pending:    { label: 'Pending',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',    icon: Clock,       next: 'assigned'   },
  assigned:   { label: 'Assigned',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       icon: User,        next: 'in_transit' },
  in_transit: { label: 'In Transit', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Truck,       next: 'delivered'  },
  delivered:  { label: 'Delivered',  color: 'text-green-400 bg-green-500/10 border-green-500/20',    icon: CheckCircle, next: null         },
  cancelled:  { label: 'Cancelled',  color: 'text-red-400 bg-red-500/10 border-red-500/20',          icon: XCircle,     next: null         },
};

const PIPELINE = ['pending', 'assigned', 'in_transit', 'delivered'];

function StatusBadge({ status }: { status: string }) {
  const cfg  = STATUS_CONFIG[status] ?? { label: status, color: 'text-white/40 bg-white/5 border-white/10', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function fmt(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Assign driver modal ───────────────────────────────────────────────────────
function AssignModal({
  job, adminKey, onDone, onCancel,
}: {
  job: Job; adminKey: string; onDone: (updated: Partial<Job>) => void; onCancel: () => void;
}) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError('Driver name is required.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/business/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({ id: job.id, status: 'assigned', driverName: name.trim(), driverEmail: email.trim() || undefined, driverPhone: phone.trim() || undefined }),
      });
      if (!res.ok) { setError('Failed to assign. Try again.'); return; }
      onDone({ status: 'assigned', driver_name: name.trim(), driver_email: email.trim() || null, driver_phone: phone.trim() || null, assigned_at: new Date().toISOString() });
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
      <div className="bg-[#0a140a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-1">Assign driver</h3>
        <p className="text-white/40 text-sm mb-5">
          Job <span className="text-emerald-400 font-mono">{job.job_ref}</span> · {job.pickup} → {job.dropoff}
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Driver name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Driver email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="driver@email.com"
                type="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Driver phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+44 7700 000000"
                type="tel"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs mb-5">
          This data will be stored against the job. The driver app (coming soon) will surface jobs automatically by location — this is the manual fallback.
        </p>

        <div className="flex gap-3">
          <button
            onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            Assign driver
          </button>
          <button onClick={onCancel} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-sm transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function AdminBusinessContent() {
  const searchParams = useSearchParams();
  const adminKey     = searchParams.get('adminKey') ?? '';

  const [jobs,       setJobs]       = useState<Job[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState<string | null>(null);
  const [filter,     setFilter]     = useState('all');
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [assignJob,  setAssignJob]  = useState<Job | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/get-jobs?adminKey=${adminKey}`);
      if (res.ok) setJobs((await res.json()).jobs ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const advanceStatus = async (job: Job, newStatus: string) => {
    // Intercept "assigned" to show the modal
    if (newStatus === 'assigned') { setAssignJob(job); return; }

    setUpdating(job.id);
    try {
      await fetch('/api/business/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body:    JSON.stringify({ id: job.id, status: newStatus }),
      });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    } catch {}
    setUpdating(null);
  };

  const handleAssigned = (updated: Partial<Job>) => {
    if (!assignJob) return;
    setJobs(prev => prev.map(j => j.id === assignJob.id ? { ...j, ...updated } : j));
    setAssignJob(null);
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const counts = {
    all:        jobs.length,
    pending:    jobs.filter(j => j.status === 'pending').length,
    assigned:   jobs.filter(j => j.status === 'assigned').length,
    in_transit: jobs.filter(j => j.status === 'in_transit').length,
    delivered:  jobs.filter(j => j.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-[#050a05] text-white">

      {assignJob && (
        <AssignModal job={assignJob} adminKey={adminKey} onDone={handleAssigned} onCancel={() => setAssignJob(null)} />
      )}

      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black">Boot<span className="text-emerald-400">Hop</span></span>
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business Admin</span>
        </div>
        <button onClick={load} className="text-white/30 hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { key: 'all',        label: 'Total',      color: 'text-white' },
            { key: 'pending',    label: 'Pending',    color: 'text-amber-400' },
            { key: 'assigned',   label: 'Assigned',   color: 'text-blue-400' },
            { key: 'in_transit', label: 'In Transit', color: 'text-purple-400' },
            { key: 'delivered',  label: 'Delivered',  color: 'text-green-400' },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`rounded-2xl border p-4 text-center transition-all ${filter === s.key ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/8 bg-white/3 hover:bg-white/5'}`}>
              <p className={`text-2xl font-black ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Pipeline */}
        <div className="flex items-center gap-2 mb-6">
          {PIPELINE.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <StatusBadge status={s} />
              {i < PIPELINE.length - 1 && <span className="text-white/20 text-xs">→</span>}
            </div>
          ))}
        </div>

        {/* Jobs */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/20">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No jobs {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => {
              const cfg        = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
              const isOpen     = expanded === job.id;
              const nextStatus = cfg.next;

              return (
                <div key={job.id}
                  className={`rounded-2xl border transition-all ${
                    job.status === 'pending'    ? 'border-amber-500/20 bg-amber-500/5' :
                    job.status === 'in_transit' ? 'border-purple-500/15 bg-purple-500/3' :
                    job.status === 'delivered'  ? 'border-green-500/15 bg-green-500/3' :
                    'border-white/8 bg-white/3'
                  }`}>

                  {/* Summary row */}
                  <button className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : job.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-emerald-400 font-bold text-sm">{job.job_ref}</span>
                        <StatusBadge status={job.status} />
                        {job.urgency === 'same_day' && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">⚡ Same day</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <MapPin className="h-3.5 w-3.5 text-white/30 shrink-0" />
                        <span className="truncate">{job.pickup}</span>
                        <span className="text-white/20 shrink-0">→</span>
                        <span className="truncate">{job.dropoff}</span>
                        {job.miles && <span className="text-white/25 text-xs shrink-0">({job.miles} mi)</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-white/30 text-xs">{job.email}</p>
                        {job.driver_name && (
                          <p className="text-blue-400 text-xs flex items-center gap-1">
                            <User className="h-3 w-3" /> {job.driver_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      {job.estimated_price && (
                        <p className="text-emerald-400 font-black text-lg">£{job.estimated_price}</p>
                      )}
                      <p className="text-white/20 text-xs">{fmt(job.created_at)}</p>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">

                      {/* Job details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {[
                          { label: 'Category',       value: job.category || '—' },
                          { label: 'Weight',         value: job.weight ? `${job.weight} kg` : '—' },
                          { label: 'Declared value', value: job.declared_value ? `£${job.declared_value}` : '—' },
                          { label: 'Insurance',      value: job.insurance ? '✅ Yes' : '❌ No' },
                        ].map(f => (
                          <div key={f.label} className="bg-white/3 rounded-xl px-4 py-3">
                            <p className="text-white/30 text-xs mb-0.5">{f.label}</p>
                            <p className="text-white font-semibold">{f.value}</p>
                          </div>
                        ))}
                      </div>

                      {job.description && (
                        <div className="bg-white/3 rounded-xl px-4 py-3">
                          <p className="text-white/30 text-xs mb-0.5">Description</p>
                          <p className="text-white text-sm">{job.description}</p>
                        </div>
                      )}

                      {/* Driver info */}
                      {job.driver_name && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-4">
                          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Assigned driver
                          </p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-white/30 text-xs mb-0.5">Name</p>
                              <p className="text-white font-semibold">{job.driver_name}</p>
                            </div>
                            <div>
                              <p className="text-white/30 text-xs mb-0.5">Email</p>
                              <p className="text-white">{job.driver_email || '—'}</p>
                            </div>
                            <div>
                              <p className="text-white/30 text-xs mb-0.5">Phone</p>
                              <p className="text-white">{job.driver_phone || '—'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-6 text-xs text-white/30 flex-wrap">
                        <span>📋 Received {fmt(job.created_at)}</span>
                        {job.assigned_at   && <span>👤 Assigned {fmt(job.assigned_at)}</span>}
                        {job.picked_up_at  && <span>🚚 Picked up {fmt(job.picked_up_at)}</span>}
                        {job.delivered_at  && <span>✅ Delivered {fmt(job.delivered_at)}</span>}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap">
                        {nextStatus && (
                          <button onClick={() => advanceStatus(job, nextStatus)} disabled={updating === job.id}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                            {updating === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Mark as {STATUS_CONFIG[nextStatus]?.label}
                          </button>
                        )}
                        {/* Re-assign button if already assigned */}
                        {job.status === 'assigned' && (
                          <button onClick={() => setAssignJob(job)}
                            className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            <User className="h-4 w-4" /> Reassign driver
                          </button>
                        )}
                        {!['cancelled', 'delivered'].includes(job.status) && (
                          <button onClick={() => advanceStatus(job, 'cancelled')} disabled={updating === job.id}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 text-white/40 hover:text-red-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                            <XCircle className="h-4 w-4" /> Cancel job
                          </button>
                        )}
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

export default function AdminBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050a05] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <AdminBusinessContent />
    </Suspense>
  );
}
