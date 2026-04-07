'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2, RefreshCw, Package, MapPin, Clock,
  CheckCircle, Truck, AlertCircle, XCircle, User,
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
  status: string;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; next: string | null }> = {
  pending:    { label: 'Pending',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   icon: Clock,        next: 'assigned'   },
  assigned:   { label: 'Assigned',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',      icon: User,         next: 'in_transit' },
  in_transit: { label: 'In Transit', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',icon: Truck,        next: 'delivered'  },
  delivered:  { label: 'Delivered',  color: 'text-green-400 bg-green-500/10 border-green-500/20',   icon: CheckCircle,  next: null         },
  cancelled:  { label: 'Cancelled',  color: 'text-red-400 bg-red-500/10 border-red-500/20',         icon: XCircle,      next: null         },
};

const PIPELINE = ['pending', 'assigned', 'in_transit', 'delivered'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-white/40 bg-white/5 border-white/10', icon: AlertCircle, next: null };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function AdminBusinessContent() {
  const searchParams = useSearchParams();
  const adminKey     = searchParams.get('adminKey');

  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating,setUpdating]= useState<string | null>(null);
  const [filter,  setFilter]  = useState<string>('all');
  const [expanded,setExpanded]= useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/get-jobs?adminKey=${adminKey}`);
      if (res.ok) { const j = await res.json(); setJobs(j.jobs ?? []); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const advanceStatus = async (job: Job, newStatus: string) => {
    setUpdating(job.id);
    try {
      await fetch('/api/business/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey ?? '' },
        body: JSON.stringify({ id: job.id, status: newStatus }),
      });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    } catch {}
    setUpdating(null);
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
            { key: 'all',        label: 'Total jobs',   color: 'text-white' },
            { key: 'pending',    label: 'Pending',      color: 'text-amber-400' },
            { key: 'assigned',   label: 'Assigned',     color: 'text-blue-400' },
            { key: 'in_transit', label: 'In Transit',   color: 'text-purple-400' },
            { key: 'delivered',  label: 'Delivered',    color: 'text-green-400' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-2xl border p-4 text-center transition-all ${filter === s.key ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/8 bg-white/3 hover:bg-white/5'}`}
            >
              <p className={`text-2xl font-black ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Pipeline legend */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {PIPELINE.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <StatusBadge status={s} />
              {i < PIPELINE.length - 1 && <span className="text-white/20 text-xs">→</span>}
            </div>
          ))}
        </div>

        {/* Jobs list */}
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
              const cfg     = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
              const isOpen  = expanded === job.id;
              const nextStatus = cfg.next;

              return (
                <div key={job.id}
                  className={`rounded-2xl border transition-all ${job.status === 'pending' ? 'border-amber-500/20 bg-amber-500/5' : job.status === 'delivered' ? 'border-green-500/15 bg-green-500/3' : 'border-white/8 bg-white/3'}`}>

                  {/* Top row */}
                  <button
                    className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : job.id)}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-emerald-400 font-bold text-sm">{job.job_ref}</span>
                          <StatusBadge status={job.status} />
                          {job.urgency === 'same_day' && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">⚡ Same day</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-white font-semibold text-sm">
                          <MapPin className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          <span className="truncate">{job.pickup}</span>
                          <span className="text-white/20">→</span>
                          <span className="truncate">{job.dropoff}</span>
                        </div>
                        <p className="text-white/30 text-xs mt-0.5">{job.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {job.estimated_price && (
                        <p className="text-emerald-400 font-black text-lg">£{job.estimated_price}</p>
                      )}
                      <p className="text-white/20 text-xs">{new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {[
                          { label: 'Category',       value: job.category       || '—' },
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

                      {/* Action buttons */}
                      <div className="flex gap-3 flex-wrap">
                        {nextStatus && (
                          <button
                            onClick={() => advanceStatus(job, nextStatus)}
                            disabled={updating === job.id}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                          >
                            {updating === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Mark as {STATUS_CONFIG[nextStatus]?.label}
                          </button>
                        )}
                        {job.status !== 'cancelled' && job.status !== 'delivered' && (
                          <button
                            onClick={() => advanceStatus(job, 'cancelled')}
                            disabled={updating === job.id}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 text-white/50 hover:text-red-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                          >
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
