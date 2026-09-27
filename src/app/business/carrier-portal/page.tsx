'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Truck, MapPin, Package, Clock, CheckCircle2, Circle, LogOut } from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';

type Job = {
  id: string;
  reference: string;
  status: string;
  delivery_type: string;
  package_size: string;
  cargo_description: string | null;
  special_instructions: string | null;
  partner_rate: number | null;
  pickup_address: string | null;
  delivery_address: string | null;
  pickup_contact: string | null;
  delivery_contact: string | null;
  assigned_at: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  assigned:    { label: 'Assigned',    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   icon: <Circle className="h-3 w-3" /> },
  collected:   { label: 'Collected',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: <Package className="h-3 w-3" /> },
  in_transit:  { label: 'In Transit',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: <Truck className="h-3 w-3" /> },
  delivered:   { label: 'Delivered',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="h-3 w-3" /> },
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CarrierPortalPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [carrier, setCarrier]   = useState<{ company_name: string; contact_name: string; email: string } | null>(null);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/business/carrier/me')
      .then(r => r.json())
      .then(me => {
        if (!me.authenticated || !me.registered || me.status !== 'active' || !me.status_active) {
          router.replace('/business/carrier-sign-in');
          return;
        }
        setCarrier({ company_name: me.company_name, contact_name: me.contact_name, email: me.email });
        setLoading(false);
        return fetch('/api/business/carrier/jobs');
      })
      .then(r => r?.json())
      .then(data => {
        if (data?.jobs) setJobs(data.jobs);
        setJobsLoading(false);
      })
      .catch(() => router.replace('/business/carrier-sign-in'));
  }, [router]);

  const signOut = async () => {
    await fetch('/api/business/auth/logout', { method: 'POST' });
    router.push('/business/carrier-sign-in');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const activeJobs    = jobs.filter(j => j.status !== 'delivered');
  const completedJobs = jobs.filter(j => j.status === 'delivered');

  return (
    <div className="min-h-screen text-slate-900" style={{ background: BG }}>
      <BusinessNav
        rightSlot={
          <>
            <span className="text-sm text-slate-600 hidden md:block">{carrier?.company_name}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </>
        }
      />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-slate-600 text-sm mb-1">Carrier dashboard</p>
              <h1 className="text-3xl font-black">{carrier?.company_name}</h1>
              <p className="text-slate-600 text-sm mt-1">{carrier?.email}</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm font-semibold text-blue-300">Active carrier</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Total jobs',    value: jobs.length },
              { label: 'Active',        value: activeJobs.length },
              { label: 'Completed',     value: completedJobs.length },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Job list */}
        {jobsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
            className="text-center py-20 border border-slate-200 rounded-2xl bg-slate-50"
          >
            <Truck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-600 mb-2">No jobs assigned yet</h2>
            <p className="text-sm text-slate-300 max-w-xs mx-auto">
              When a job in your coverage area is matched to you, it will appear here. You'll also receive an email alert.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
          >
            {activeJobs.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Active jobs</p>
                {activeJobs.map(job => <JobCard key={job.id} job={job} />)}
              </>
            )}

            {completedJobs.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-8 mb-3">Completed</p>
                {completedJobs.map(job => <JobCard key={job.id} job={job} muted />)}
              </>
            )}
          </motion.div>
        )}
      </div>

      <BusinessFooter />
    </div>
  );
}

function JobCard({ job, muted = false }: { job: Job; muted?: boolean }) {
  const statusCfg = STATUS_CONFIG[job.status] ?? { label: job.status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Circle className="h-3 w-3" /> };
  const typeLabel = job.delivery_type === 'uk' ? 'UK' : 'International';

  return (
    <div className={`bg-slate-50 border ${muted ? 'border-slate-100 opacity-60' : 'border-slate-200'} rounded-2xl p-5`}>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-300 font-mono mb-1">{job.reference}</p>
          <p className="font-bold">{job.cargo_description || job.package_size || '—'}</p>
          <p className="text-xs text-slate-600 mt-0.5">{typeLabel} delivery · Assigned {fmt(job.assigned_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
            {statusCfg.icon} {statusCfg.label}
          </span>
          {job.partner_rate && (
            <span className="text-sm font-black text-emerald-600">£{job.partner_rate.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 mb-0.5">Pickup</p>
            <p className="text-sm text-slate-700 leading-snug truncate">{job.pickup_address || '—'}</p>
            {job.pickup_contact && <p className="text-xs text-slate-600 truncate">{job.pickup_contact}</p>}
          </div>
        </div>
        <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 mb-0.5">Delivery</p>
            <p className="text-sm text-slate-700 leading-snug truncate">{job.delivery_address || '—'}</p>
            {job.delivery_contact && <p className="text-xs text-slate-600 truncate">{job.delivery_contact}</p>}
          </div>
        </div>
      </div>

      {job.special_instructions && (
        <div className="mt-2 flex items-start gap-2 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/70">{job.special_instructions}</p>
        </div>
      )}
    </div>
  );
}
