'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, ArrowRight, LogOut, Pencil,
  XCircle, User, AlertCircle, X, MessageCircle,
  Zap, Globe, Truck, Shield, Star, Package,
} from 'lucide-react';
import { BusinessBookingWizard } from '@/components/business/BookingWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'loading' | 'hub' | 'wizard' | 'jobs' | 'success';

type MyJob = {
  id: string; job_ref: string; company_name: string | null;
  pickup: string; dropoff: string; status: string; urgency: string;
  estimated_price: number | null; driver_name: string | null;
  driver_phone: string | null; assigned_at: string | null;
  picked_up_at: string | null; delivered_at: string | null;
  created_at: string;
};

type EditForm = {
  pickup: string; dropoff: string; description: string;
  urgency: string; delivery_date: string; expected_delivery_date: string;
};

const EMPTY_EDIT: EditForm = { pickup: '', dropoff: '', description: '', urgency: 'priority', delivery_date: '', expected_delivery_date: '' };

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

const STATUS_COLORS: Record<string, string> = {
  pending:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  review:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  assigned:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  in_transit: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  delivered:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cancelled:  'text-red-400 bg-red-500/10 border-red-500/20',
  failed:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending — awaiting assignment',
  review:     'Under review',
  assigned:   'Driver assigned',
  in_transit: 'In transit',
  delivered:  'Delivered ✓',
  cancelled:  'Cancelled',
  failed:     'Failed delivery',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PriorityPortalPage() {
  const router = useRouter();

  const [stage,        setStage]        = useState<Stage>('loading');
  const [bizEmail,     setBizEmail]     = useState('');
  const [companyName,  setCompanyName]  = useState('');
  const [discount,     setDiscount]     = useState<number | null>(null);
  const [jobRef,       setJobRef]       = useState('');

  const [myJobs,       setMyJobs]       = useState<MyJob[]>([]);
  const [jobsLoading,  setJobsLoading]  = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [editingJob,   setEditingJob]   = useState<MyJob | null>(null);
  const [editForm,     setEditForm]     = useState<EditForm>(EMPTY_EDIT);
  const [editLoading,  setEditLoading]  = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.replace('/business'); return; }
        if (d.partner_status !== 'active') { router.replace('/business/portal'); return; }
        setBizEmail(d.email ?? '');
        if (d.company_name) setCompanyName(d.company_name);
        if (d.discount)     setDiscount(d.discount);
        setStage('hub');
      })
      .catch(() => router.replace('/business'));
  }, [router]);

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  const loadMyJobs = async () => {
    setJobsLoading(true);
    try {
      const j = await fetch('/api/business/my-jobs').then(r => r.json());
      setMyJobs(j.jobs ?? []);
    } catch { /* silent */ }
    finally { setJobsLoading(false); }
  };

  const cancelJob = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch('/api/business/cancel-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j   = await res.json();
      if (res.ok) setMyJobs(p => p.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
      else alert(j.error || 'Could not cancel job.');
    } catch { alert('Something went wrong.'); }
    finally { setCancellingId(null); }
  };

  const openEdit = (job: MyJob) => {
    setEditForm({ pickup: job.pickup, dropoff: job.dropoff, description: '', urgency: job.urgency, delivery_date: '', expected_delivery_date: '' });
    setEditError(null);
    setEditingJob(job);
  };

  const saveEdit = async () => {
    if (!editingJob) return;
    if (!editForm.pickup || !editForm.dropoff) { setEditError('Pickup and drop-off are required.'); return; }
    setEditLoading(true); setEditError(null);
    try {
      const res = await fetch('/api/business/update-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingJob.id, ...editForm }) });
      const j   = await res.json();
      if (!res.ok) { setEditError(j.error || 'Could not update job.'); return; }
      setMyJobs(p => p.map(job => job.id === editingJob.id ? { ...job, pickup: editForm.pickup, dropoff: editForm.dropoff } : job));
      setEditingJob(null);
    } catch { setEditError('Something went wrong.'); }
    finally { setEditLoading(false); }
  };

  const logout = async () => { await fetch('/api/business/auth/logout', { method: 'POST' }); router.replace('/business'); };

  const fmt = (ts: string | null) =>
    ts ? new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (stage === 'wizard') {
    return (
      <BusinessBookingWizard
        tier="priority"
        bizEmail={bizEmail}
        companyName={companyName}
        onSuccess={ref => { setJobRef(ref); setStage('success'); }}
        onCancel={() => setStage('hub')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080c10] text-white">

      {/* Nav bar */}
      <nav className="border-b border-amber-500/15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-black text-xl tracking-tight">BootHop</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest">
            <Star className="h-3 w-3" /> Priority Partner
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-sm hidden sm:block">{bizEmail}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">

        {/* ══ HUB ══ */}
        {stage === 'hub' && (
          <motion.div key="hub" {...FADE} className="max-w-5xl mx-auto px-6 py-12">

            {/* Welcome */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
                <Star className="h-3.5 w-3.5" /> Priority Partner Account
              </div>
              <p className="text-white/30 text-sm mb-1">Welcome back{companyName ? `, ${companyName}` : ''}</p>
              <h1 className="text-4xl font-black tracking-tight">Priority access,<br /><span className="text-amber-400">guaranteed response.</span></h1>
              <p className="text-white/35 mt-3 max-w-xl leading-relaxed">
                As a BootHop Priority Partner, your jobs are first in the allocation queue. Expect operator assignment within 2 hours on all bookings.
              </p>
              {discount && (
                <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 font-bold text-sm">{discount}% partner discount applied to all bookings</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => setStage('wizard')}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20"
              >
                <Zap className="h-4 w-4" /> Book priority delivery
              </button>
              <button
                onClick={() => { setStage('jobs'); loadMyJobs(); }}
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                View my jobs <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Priority benefits */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { icon: Zap,    label: 'First allocation',   sub: 'Operators assigned before standard queue' },
                { icon: Globe,  label: 'All routes',         sub: 'UK, EU, and global capability' },
                { icon: Shield, label: 'SLA-backed',         sub: 'Dedicated capacity guarantee' },
                { icon: Truck,  label: 'Dedicated support',  sub: 'Direct line to ops team' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 text-center">
                  <Icon className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Pricing tiers */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-6">
              <p className="text-xs font-black text-amber-400/50 uppercase tracking-widest mb-4">Your pricing tiers</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-bold text-amber-400 mb-2">UK → UK</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Express (3–6 hr)  — from £300</p>
                    <p>Priority (1–3 hr) — from £700</p>
                    <p>Critical (immed.) — from £1,200</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-amber-400 mb-2">UK ↔ EU</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Next-day  — from £1,000</p>
                    <p>Same-day  — from £1,500</p>
                    <p>Critical  — from £2,500</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-amber-400 mb-2">UK → Global</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Standard  — from £2,000</p>
                    <p>Priority  — from £4,000</p>
                    <p>Critical  — from £7,000</p>
                  </div>
                </div>
              </div>
              {discount && (
                <p className="text-xs text-amber-400/60 mt-4 pt-4 border-t border-amber-500/15">
                  Your {discount}% partner discount is applied automatically at checkout.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ JOBS ══ */}
        {stage === 'jobs' && (
          <motion.div key="jobs" {...FADE} className="max-w-3xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => setStage('hub')} className="flex items-center gap-1.5 text-white/30 hover:text-white text-sm font-semibold transition-colors mb-2">
                  ← Back
                </button>
                <h2 className="text-2xl font-black">My priority deliveries</h2>
              </div>
              <button
                onClick={() => setStage('wizard')}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                <Zap className="h-4 w-4" /> New booking
              </button>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-amber-400 animate-spin" /></div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-10 w-10 text-white/10 mx-auto mb-4" />
                <p className="text-white/30">No deliveries yet.</p>
                <button onClick={() => setStage('wizard')} className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors flex items-center gap-2 mx-auto">
                  Book your first priority delivery <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map(job => {
                  const canAct = ['pending', 'assigned', 'review'].includes(job.status);
                  return (
                    <div
                      key={job.id}
                      className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all hover:border-amber-500/25 hover:bg-white/5 hover:-translate-y-0.5"
                    >
                      <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/12 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <span className="font-mono font-black text-amber-400 text-sm">{job.job_ref}</span>
                            <span className="text-xs text-amber-400/70 bg-amber-500/8 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Priority</span>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[job.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                              {STATUS_LABELS[job.status] ?? job.status}
                            </span>
                          </div>
                          <p className="text-white font-semibold text-sm mb-1">{job.pickup} → {job.dropoff}</p>
                          <p className="text-white/25 text-xs">
                            {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {job.driver_name && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
                              <User className="h-3.5 w-3.5" /><span>{job.driver_name}</span>
                              {job.driver_phone && <span>· {job.driver_phone}</span>}
                            </div>
                          )}
                          {(job.assigned_at || job.picked_up_at || job.delivered_at) && (
                            <div className="mt-3 space-y-1">
                              {job.assigned_at  && <p className="text-xs text-white/25">Assigned: {fmt(job.assigned_at)}</p>}
                              {job.picked_up_at && <p className="text-xs text-white/25">Collected: {fmt(job.picked_up_at)}</p>}
                              {job.delivered_at && <p className="text-xs text-emerald-400/60">Delivered: {fmt(job.delivered_at)}</p>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {job.estimated_price !== null && (
                            <span className="text-amber-400 font-black text-lg">£{job.estimated_price.toLocaleString()}</span>
                          )}
                          {canAct && (
                            <button onClick={() => openEdit(job)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/35 hover:text-amber-400 bg-white/5 border border-white/10 hover:border-amber-500/20 hover:bg-amber-500/8 px-3 py-2 rounded-xl transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Amend
                            </button>
                          )}
                          {canAct && (
                            <button onClick={() => cancelJob(job.id)} disabled={cancellingId === job.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/25 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/20 hover:bg-red-500/8 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                            >
                              {cancellingId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ SUCCESS ══ */}
        {stage === 'success' && (
          <motion.div key="success" {...FADE} className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-amber-400" />
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
                <Star className="h-3.5 w-3.5" /> Priority Job Submitted
              </div>
              <h2 className="text-4xl font-black mb-3">Booking received</h2>
              <p className="text-white/40 mb-3 leading-relaxed">Your priority delivery request has been received.</p>
              <p className="text-amber-400/80 text-sm mb-8">Operator assignment within 2 hours — flagged as Priority.</p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-8 py-5 inline-block mb-6">
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Reference</p>
                <p className="text-amber-400 font-mono font-black text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/20 text-sm mb-8">Confirmation sent to <span className="text-white/35">{bizEmail}</span></p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => setStage('hub')} className="text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors">
                  Back to portal →
                </button>
                <button onClick={() => { setStage('jobs'); loadMyJobs(); }} className="text-white/35 hover:text-white text-sm font-semibold transition-colors">
                  View all jobs →
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* WhatsApp FAB */}
      <a href="/api/whatsapp" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all" aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* ── Edit modal ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-[#0d1117] border border-amber-500/20 rounded-2xl p-6 shadow-2xl">
            <button onClick={() => setEditingJob(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-black">Amend priority job</h3>
              <span className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Priority</span>
            </div>
            <p className="text-white/25 text-xs mb-6 font-mono">{editingJob.job_ref}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Pickup</label>
                <input type="text" value={editForm.pickup} onChange={e => setEditForm(f => ({ ...f, pickup: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Drop-off</label>
                <input type="text" value={editForm.dropoff} onChange={e => setEditForm(f => ({ ...f, dropoff: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Collection date</label>
                  <input type="date" value={editForm.delivery_date} onChange={e => setEditForm(f => ({ ...f, delivery_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Must arrive by</label>
                  <input type="date" value={editForm.expected_delivery_date} onChange={e => setEditForm(f => ({ ...f, expected_delivery_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors" />
                </div>
              </div>
            </div>
            {editError && <p className="mt-4 text-xs text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0" />{editError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingJob(null)} className="flex-1 text-sm font-semibold text-white/30 hover:text-white bg-white/5 border border-white/10 px-4 py-3 rounded-xl transition-all">Cancel</button>
              <button onClick={saveEdit} disabled={editLoading} className="flex-1 text-sm font-black text-black bg-amber-400 hover:bg-amber-300 px-4 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
