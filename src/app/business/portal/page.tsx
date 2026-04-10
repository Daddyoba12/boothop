'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, ArrowRight, LogOut, Pencil,
  XCircle, User, Loader2 as Spin, AlertCircle, X, MessageCircle,
  Zap, Globe, Truck, Shield, Clock, Package,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import { BusinessBookingWizard } from '@/components/business/BookingWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'loading' | 'hub' | 'wizard' | 'jobs' | 'success';

type MyJob = {
  id: string; job_ref: string; company_name: string | null;
  pickup: string; dropoff: string; status: string; urgency: string;
  estimated_price: number | null; driver_name: string | null;
  driver_phone: string | null; assigned_at: string | null;
  picked_up_at: string | null; delivered_at: string | null;
  created_at: string; route_type?: string | null;
};

type EditForm = {
  pickup: string; dropoff: string; description: string;
  urgency: string; delivery_date: string; expected_delivery_date: string;
};

const EMPTY_EDIT: EditForm = { pickup: '', dropoff: '', description: '', urgency: 'planned', delivery_date: '', expected_delivery_date: '' };

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  pending:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  review:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  assigned:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  in_transit: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  delivered:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cancelled:  'text-red-400 bg-red-500/10 border-red-500/20',
  failed:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Payment pending',
  pending:    'Pending — awaiting assignment',
  review:     'Under review',
  assigned:   'Driver assigned',
  in_transit: 'In transit',
  delivered:  'Delivered ✓',
  cancelled:  'Cancelled',
  failed:     'Failed delivery',
};

// ── Pricing tiers shown on hub ────────────────────────────────────────────────

const LANES = [
  { flag: '🇬🇧', label: 'UK → UK',     from: 'from £300',   desc: '3–6 hr Express · 1–3 hr Priority · Immediate Critical',     color: 'emerald' },
  { flag: '🇪🇺', label: 'UK → EU',     from: 'from £1,000', desc: 'Next-day £1,000 · Same-day £1,500 · Critical £2,500+',       color: 'blue'   },
  { flag: '🇬🇧', label: 'EU → UK',     from: 'from £1,000', desc: 'Hand-carry inbound from any EU point',                        color: 'violet' },
  { flag: '🌍', label: 'UK → Global', from: 'from £2,000', desc: 'International hand-carry to any destination',                  color: 'rose'   },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessPortalPage() {
  const router = useRouter();

  const [stage,            setStage]           = useState<Stage>('loading');
  const [bizEmail,         setBizEmail]        = useState('');
  const [companyName,      setCompanyName]     = useState('');
  const [jobRef,           setJobRef]          = useState('');
  const [isPaid,           setIsPaid]          = useState(false);
  const [paymentCancelled, setPaymentCancelled]= useState(false);
  const [uploads,          setUploads]         = useState<Record<string, { uploading: boolean; done: boolean; name: string; error: string | null }>>({});

  const [myJobs,      setMyJobs]      = useState<MyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [cancellingId,setCancellingId]= useState<string | null>(null);

  const [editingJob,  setEditingJob]  = useState<MyJob | null>(null);
  const [editForm,    setEditForm]    = useState<EditForm>(EMPTY_EDIT);
  const [editLoading, setEditLoading] = useState(false);
  const [editError,   setEditError]   = useState<string | null>(null);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.replace('/business'); return; }
        if (d.partner_status === 'active') { router.replace('/business/portal/priority'); return; }
        setBizEmail(d.email ?? '');
        if (d.company_name) setCompanyName(d.company_name);
        const params    = new URLSearchParams(window.location.search);
        const payResult = params.get('payment');
        const payRef    = params.get('jobRef');
        if (payResult === 'success' && payRef) {
          setJobRef(payRef); setIsPaid(true); setStage('success');
        } else if (payResult === 'cancelled') {
          setPaymentCancelled(true); setStage('hub');
        } else {
          setStage('hub');
        }
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

  const BG = 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)';

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (stage === 'wizard') {
    return (
      <BusinessBookingWizard
        tier="standard"
        bizEmail={bizEmail}
        companyName={companyName}
        onSuccess={(ref, paid) => { setJobRef(ref); setIsPaid(paid); setStage('success'); }}
        onCancel={() => setStage('hub')}
      />
    );
  }

  return (
    <div className="relative min-h-screen text-white" style={{ background: BG }}>

      {/* Premium ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[10%] left-[3%]  w-[500px] h-[500px] bg-emerald-500/8  rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[5%] w-[400px] h-[400px] bg-blue-600/8   rounded-full blur-[130px]" />
        <div className="absolute top-[65%] left-[35%] w-[360px] h-[360px] bg-violet-500/6  rounded-full blur-[120px]" />
      </div>

      {/* Nav bar */}
      <div className="relative z-10">
        <BusinessNav
          rightSlot={
            <>
              <span className="text-white/30 text-sm hidden sm:block">{bizEmail}</span>
              <button onClick={logout} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          }
        />
      </div>

      <AnimatePresence mode="wait">

        {/* ══ HUB ══ */}
        {stage === 'hub' && (
          <motion.div key="hub" {...FADE} className="relative z-10 max-w-5xl mx-auto px-6 py-12">

            {/* Payment cancelled banner */}
            {paymentCancelled && (
              <div className="mb-8 flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-4">
                <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-400">Payment cancelled</p>
                  <p className="text-xs text-white/35 mt-0.5">Your booking was not completed. No charge was made — you can try again whenever you're ready.</p>
                </div>
                <button onClick={() => setPaymentCancelled(false)} className="ml-auto text-white/20 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Welcome */}
            <div className="mb-10">
              <p className="text-white/30 text-sm mb-1">Welcome back{companyName ? `, ${companyName}` : ''}</p>
              <h1 className="text-4xl font-black tracking-tight">Time-critical logistics,<br /><span className="text-emerald-400">on demand.</span></h1>
              <p className="text-white/35 mt-3 max-w-xl leading-relaxed">
                BootHop moves high-value, time-sensitive components directly — no depots, no delays.
                Hours, not days.
              </p>
            </div>

            {/* Portal photo strip */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { src: '/images/businessImage/biz-hero.jpg',      label: 'Engineering & Manufacturing' },
                { src: '/images/businessImage/biz-team.jpg',       label: 'Aerospace & Industrial' },
                { src: '/images/businessImage/biz-handshake.jpg',  label: 'Verified operators' },
              ].map(({ src, label }) => (
                <div key={label} className="relative overflow-hidden rounded-xl h-28 group cursor-pointer" onClick={() => setStage('wizard')}>
                  <Image src={src} alt={label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white/80 uppercase tracking-wider leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => setStage('wizard')}
                className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <Zap className="h-4 w-4" /> Book a delivery
              </button>
              <button
                onClick={() => { setStage('jobs'); loadMyJobs(); }}
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                View my jobs <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Service lanes pricing */}
            <div className="mb-10">
              <p className="text-xs font-black text-white/25 uppercase tracking-widest mb-4">Service lanes & pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LANES.map(lane => (
                  <div
                    key={lane.label}
                    className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-5 transition-all hover:border-emerald-500/25 hover:bg-white/5 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                    onClick={() => setStage('wizard')}
                  >
                    <div className="pointer-events-none absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{lane.flag}</span>
                      <span className="text-emerald-400 font-black text-lg">{lane.from}</span>
                    </div>
                    <p className="font-black text-white mb-1">{lane.label}</p>
                    <p className="text-white/35 text-xs leading-relaxed">{lane.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Value props */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { icon: Zap,    label: 'Speed',     sub: 'Hours, not days' },
                { icon: Globe,  label: 'Precision', sub: 'Direct point-to-point' },
                { icon: Shield, label: 'Trust',     sub: 'Verified operators' },
                { icon: Truck,  label: 'Flexibility',sub: 'UK, EU, global' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
                  <Icon className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Pricing detail */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <p className="text-xs font-black text-white/25 uppercase tracking-widest mb-4">How pricing works</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-bold text-emerald-400 mb-2">UK → UK</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Express (3–6 hr)  — from £300</p>
                    <p>Priority (1–3 hr) — from £700</p>
                    <p>Critical (immed.) — from £1,200</p>
                    <p className="text-white/25 mt-2">First 50 miles included.<br/>Extra: £3–£6.50/mile.</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-blue-400 mb-2">UK ↔ EU</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Next-day  — from £1,000</p>
                    <p>Same-day  — from £1,500</p>
                    <p>Critical  — from £2,500</p>
                    <p className="text-white/25 mt-2">Airport-to-airport base.<br/>Extra mileage billed separately.</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-rose-400 mb-2">UK → Global</p>
                  <div className="space-y-1 text-white/40 text-xs">
                    <p>Standard  — from £2,000</p>
                    <p>Priority  — from £4,000</p>
                    <p>Critical  — from £7,000</p>
                    <p className="text-white/25 mt-2">Multi-leg air + road.<br/>Insurance 5% of declared value.</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/20 mt-4 pt-4 border-t border-white/8">
                Add-ons: Night service +£200 · Immediate dispatch +£200 · Weekend +20% · Dedicated driver +£300 · Airport meet &amp; greet £175/end
              </p>
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
                <h2 className="text-2xl font-black">My deliveries</h2>
              </div>
              <button
                onClick={() => setStage('wizard')}
                className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                <Zap className="h-4 w-4" /> New booking
              </button>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-emerald-400 animate-spin" /></div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-10 w-10 text-white/10 mx-auto mb-4" />
                <p className="text-white/30">No deliveries yet.</p>
                <button onClick={() => setStage('wizard')} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors flex items-center gap-2 mx-auto">
                  Book your first delivery <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map(job => {
                  const canAct = ['pending', 'assigned', 'review'].includes(job.status);
                  return (
                    <div
                      key={job.id}
                      className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all hover:border-emerald-500/25 hover:bg-white/5 hover:-translate-y-0.5"
                    >
                      <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/12 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <span className="font-mono font-black text-emerald-400 text-sm">{job.job_ref}</span>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[job.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                              {STATUS_LABELS[job.status] ?? job.status}
                            </span>
                            {job.urgency === 'critical' && <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">🔴 Critical</span>}
                            {job.urgency === 'priority' && <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">⚡ Priority</span>}
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
                            <span className="text-emerald-400 font-black text-lg">£{job.estimated_price.toLocaleString()}</span>
                          )}
                          {canAct && (
                            <button onClick={() => openEdit(job)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/35 hover:text-emerald-400 bg-white/5 border border-white/10 hover:border-emerald-500/20 hover:bg-emerald-500/8 px-3 py-2 rounded-xl transition-all"
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
          <motion.div key="success" {...FADE} className="max-w-lg mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              {isPaid ? (
                <>
                  <h2 className="text-4xl font-black mb-3">Payment received</h2>
                  <p className="text-white/40 mb-2 leading-relaxed">Your payment has been received. Your job is now under review — we'll confirm dispatch and send you full details by email.</p>
                  <p className="text-emerald-400/70 text-sm mb-6">Usually confirmed within 2–4 hours during business hours.</p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-black mb-3">Submitted for review</h2>
                  <p className="text-white/40 mb-6 leading-relaxed">Your delivery request requires manual review. Our team will be in touch within 2 hours to confirm pricing and dispatch.</p>
                </>
              )}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-5 inline-block mb-4">
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Reference</p>
                <p className="text-emerald-400 font-mono font-black text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/20 text-sm">Confirmation sent to <span className="text-white/35">{bizEmail}</span></p>
            </div>

            {/* Document upload */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-8">
              <p className="text-xs font-black text-white/25 uppercase tracking-widest mb-1">Supporting documents</p>
              <p className="text-white/30 text-xs mb-5">Optional — attach commercial invoice, packing list, or other paperwork. PDF, JPG, PNG or Word · max 10 MB.</p>
              <div className="space-y-2.5">
                {[
                  { key: 'commercial_invoice',    label: 'Commercial Invoice' },
                  { key: 'packing_list',          label: 'Packing List' },
                  { key: 'certificate_of_origin', label: 'Certificate of Origin' },
                  { key: 'other',                 label: 'Other document' },
                ].map(({ key, label }) => {
                  const u = uploads[key];
                  return (
                    <label key={key} className="flex items-center justify-between gap-3 bg-white/4 hover:bg-white/6 border border-white/8 hover:border-emerald-500/20 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                      <span className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
                      {u?.done ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold shrink-0"><CheckCircle className="h-3.5 w-3.5" /> Uploaded</span>
                      ) : u?.uploading ? (
                        <Spin className="h-4 w-4 text-emerald-400 animate-spin shrink-0" />
                      ) : u?.error ? (
                        <span className="text-xs text-red-400 shrink-0 max-w-[140px] text-right">{u.error}</span>
                      ) : (
                        <span className="text-xs text-white/20 font-semibold shrink-0">Choose file</span>
                      )}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          fd.append('jobRef', jobRef);
                          fd.append('docType', key);
                          setUploads(prev => ({ ...prev, [key]: { uploading: true, done: false, name: file.name, error: null } }));
                          fetch('/api/business/upload-document', { method: 'POST', body: fd })
                            .then(r => r.json().then(j => ({ ok: r.ok, j })))
                            .then(({ ok, j }) => {
                              if (!ok) throw new Error(j.error || 'Upload failed');
                              setUploads(prev => ({ ...prev, [key]: { uploading: false, done: true, name: file.name, error: null } }));
                            })
                            .catch(err => setUploads(prev => ({ ...prev, [key]: { uploading: false, done: false, name: file.name, error: err.message } })));
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setStage('hub')} className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
                Back to portal →
              </button>
              <button onClick={() => { setStage('jobs'); loadMyJobs(); }} className="text-white/35 hover:text-white text-sm font-semibold transition-colors">
                View all jobs →
              </button>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button onClick={() => setEditingJob(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-black mb-1">Amend job</h3>
            <p className="text-white/25 text-xs mb-6 font-mono">{editingJob.job_ref}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Pickup</label>
                <input type="text" value={editForm.pickup} onChange={e => setEditForm(f => ({ ...f, pickup: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Drop-off</label>
                <input type="text" value={editForm.dropoff} onChange={e => setEditForm(f => ({ ...f, dropoff: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Collection date</label>
                  <input type="date" value={editForm.delivery_date} onChange={e => setEditForm(f => ({ ...f, delivery_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-1.5">Must arrive by</label>
                  <input type="date" value={editForm.expected_delivery_date} onChange={e => setEditForm(f => ({ ...f, expected_delivery_date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors" />
                </div>
              </div>
            </div>
            {editError && <p className="mt-4 text-xs text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4 flex-shrink-0" />{editError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingJob(null)} className="flex-1 text-sm font-semibold text-white/30 hover:text-white bg-white/5 border border-white/10 px-4 py-3 rounded-xl transition-all">Cancel</button>
              <button onClick={saveEdit} disabled={editLoading} className="flex-1 text-sm font-black text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
