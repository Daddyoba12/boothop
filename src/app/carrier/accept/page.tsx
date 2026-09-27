'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Truck, Package, MapPin, PoundSterling, Clock } from 'lucide-react';

type JobSummary = {
  id: string;
  reference: string;
  delivery_type: string;
  package_size: string | null;
  cargo_description: string | null;
  special_instructions: string | null;
  partner_rate: number | null;
  match_radius_miles: number | null;
  pickup_address: string | null;
  delivery_address: string | null;
  created_at: string;
};

type Stage = 'loading' | 'ready' | 'confirming' | 'success' | 'taken' | 'error';

function AreaFromAddress(addr: string | null): string {
  if (!addr) return '—';
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? '—';
}

export default function CarrierAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    }>
      <AcceptInner />
    </Suspense>
  );
}

function AcceptInner() {
  const params    = useSearchParams();
  const jobId     = params.get('job');
  const carrierId = params.get('carrier');

  const [stage, setStage] = useState<Stage>('loading');
  const [job,   setJob]   = useState<JobSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) { setStage('error'); setError('Missing job reference in link.'); return; }

    const url = carrierId
      ? `/api/business/jobs/accept?job=${jobId}&carrier=${carrierId}`
      : `/api/business/jobs/accept?job=${jobId}`;

    fetch(url)
      .then(async r => {
        if (r.status === 409) { setStage('taken'); return; }
        if (!r.ok) { const j = await r.json(); throw new Error(j.error || 'Job not found'); }
        const j = await r.json();
        setJob(j.job);
        setStage('ready');
      })
      .catch(e => { setStage('error'); setError(e.message); });
  }, [jobId, carrierId]);

  const accept = async () => {
    if (!jobId || !carrierId || !job) return;
    setStage('confirming');
    try {
      const res = await fetch('/api/business/jobs/accept', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ job_id: jobId, carrier_id: carrierId }),
      });
      const data = await res.json();
      if (res.status === 409 || data.error === 'already_taken') { setStage('taken'); return; }
      if (!res.ok) throw new Error(data.error || 'Failed to accept job');
      setStage('success');
    } catch (e: unknown) {
      setStage('error');
      setError(e instanceof Error ? e.message : 'Something went wrong. Call ops: +44 115 661 2825');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50">

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xl font-black">
            <span className="text-blue-600">Boot</span><span className="text-blue-500">Hop</span>
          </p>
          <p className="text-slate-600 text-xs mt-1 uppercase tracking-widest font-bold">Carrier Portal</p>
        </div>

        {/* Loading */}
        {stage === 'loading' && (
          <div className="text-center py-16">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm">Loading job details…</p>
          </div>
        )}

        {/* Ready to accept */}
        {(stage === 'ready' || stage === 'confirming') && job && (
          <div className="bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600/70 uppercase tracking-widest mb-1">Job available</p>
                <p className="font-mono font-black text-slate-900 text-lg tracking-widest">{job.reference}</p>
              </div>
              <Truck className="h-6 w-6 text-blue-500" />
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-4">

              {/* Route */}
              <div className="flex items-start gap-4">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Route</p>
                  <p className="text-slate-900 font-semibold text-sm">
                    {AreaFromAddress(job.pickup_address)}
                    <span className="text-slate-300 mx-2">→</span>
                    {AreaFromAddress(job.delivery_address)}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {job.delivery_type === 'uk' ? 'UK domestic delivery' : 'International delivery'}
                  </p>
                </div>
              </div>

              {/* Package */}
              <div className="flex items-start gap-4">
                <Package className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Cargo</p>
                  <p className="text-slate-900 font-semibold text-sm capitalize">
                    {job.cargo_description || (job.package_size ? `${job.package_size} package` : '—')}
                  </p>
                  {job.special_instructions && (
                    <p className="text-slate-600 text-xs mt-0.5">{job.special_instructions}</p>
                  )}
                </div>
              </div>

              {/* Payout */}
              <div className="flex items-start gap-4">
                <PoundSterling className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Your payout</p>
                  <p className="text-emerald-600 font-black text-2xl">
                    £{job.partner_rate?.toLocaleString() ?? 'Quoted on acceptance'}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">Transferred within 1 week of confirmed delivery</p>
                </div>
              </div>

              {/* Speed note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-amber-700 text-xs font-semibold">
                  First carrier to accept wins this job. Full pickup and delivery addresses sent to your email immediately.
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-6">
              {!carrierId ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-red-600 text-sm font-semibold">Invalid link — carrier ID missing.</p>
                  <p className="text-slate-600 text-xs mt-1">Call ops: +44 115 661 2825</p>
                </div>
              ) : (
                <button
                  onClick={accept}
                  disabled={stage === 'confirming'}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black text-base px-6 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                >
                  {stage === 'confirming'
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Accepting…</>
                    : <><Truck className="h-5 w-5" /> Accept this job</>
                  }
                </button>
              )}
              <p className="text-center text-slate-600 text-xs mt-3">
                By accepting you confirm you are available and your details are registered with BootHop.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="bg-white border border-emerald-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-2xl px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Job accepted!</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              The full pickup and delivery addresses have been sent to your email. Call the client to confirm collection time.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm space-y-1.5 text-left">
              <p className="text-slate-600"><span className="font-bold text-slate-900">1.</span> Check your email for full address details</p>
              <p className="text-slate-600"><span className="font-bold text-slate-900">2.</span> Collect the shipment and tap <strong>Collected</strong> in the email</p>
              <p className="text-slate-600"><span className="font-bold text-slate-900">3.</span> Tap <strong>In transit</strong> when you set off</p>
              <p className="text-slate-600"><span className="font-bold text-slate-900">4.</span> Tap <strong>Delivered</strong> on handover — payment starts</p>
            </div>
            <p className="text-slate-600 text-xs mt-6">Problems? Call ops: <strong>+44 115 661 2825</strong></p>
          </div>
        )}

        {/* Already taken */}
        {stage === 'taken' && (
          <div className="bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-2xl px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-9 w-9 text-slate-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Job already taken</h2>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Another carrier accepted this job first. Stay logged in for the next opportunity — we alert all active carriers simultaneously.
            </p>
            <p className="text-slate-600 text-xs">Questions? Call: <strong>+44 115 661 2825</strong></p>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="bg-white border border-red-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-2xl px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <XCircle className="h-9 w-9 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-600 text-sm mb-4">{error || 'Unable to load job details.'}</p>
            <p className="text-slate-600 text-sm font-semibold">Call ops: <strong className="text-slate-700">+44 115 661 2825</strong></p>
          </div>
        )}

      </div>
    </div>
  );
}
