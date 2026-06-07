'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, Users, CheckCircle, XCircle,
  Clock, Shield, Truck, Plane, ChevronDown, ChevronUp,
} from 'lucide-react';

type Carrier = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  base_location: string | null;
  fleet_size: string | null;
  cert_adr: boolean;
  cert_iata_dg: boolean;
  cert_gdp: boolean;
  cert_aviation_security: boolean;
  cert_iso9001: boolean;
  cert_tapa: boolean;
  cert_medical: boolean;
  cargo_aog: boolean;
  cargo_industrial: boolean;
  cargo_pharma: boolean;
  cargo_electronics: boolean;
  cargo_automotive: boolean;
  cargo_general: boolean;
  svc_sameday_uk: boolean;
  svc_international: boolean;
  svc_airport: boolean;
  svc_ooh: boolean;
  svc_refrigerated: boolean;
  svc_hazmat: boolean;
  notes: string | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending:  'text-amber-400  bg-amber-500/10  border-amber-500/25',
  active:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  rejected: 'text-red-400    bg-red-500/10    border-red-500/25',
};

const CERT_LABELS: (keyof Carrier)[] = [
  'cert_adr', 'cert_iata_dg', 'cert_gdp', 'cert_aviation_security',
  'cert_iso9001', 'cert_tapa', 'cert_medical',
];
const CERT_NAMES: Record<string, string> = {
  cert_adr: 'ADR', cert_iata_dg: 'IATA DG', cert_gdp: 'GDP',
  cert_aviation_security: 'AVSEC', cert_iso9001: 'ISO 9001',
  cert_tapa: 'TAPA', cert_medical: 'Medical',
};

const SVC_LABELS: (keyof Carrier)[] = [
  'svc_sameday_uk', 'svc_international', 'svc_airport',
  'svc_ooh', 'svc_refrigerated', 'svc_hazmat',
];
const SVC_NAMES: Record<string, string> = {
  svc_sameday_uk: 'Same-day', svc_international: 'Intl', svc_airport: 'Airport',
  svc_ooh: 'OOH', svc_refrigerated: 'Reefer', svc_hazmat: 'Hazmat',
};

export default function CarriersAdminPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async (status = 'all') => {
    setLoading(true);
    const res  = await fetch(`/api/admin/carriers?status=${status}`);
    const data = await res.json();
    setCarriers(data.carriers ?? []);
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch('/api/admin/carriers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load(filter);
    setUpdating(null);
  };

  const pending  = carriers.filter(c => c.status === 'pending').length;
  const active   = carriers.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
              <Users className="h-7 w-7 text-blue-300" />
              Carrier Network
            </h1>
            <p className="text-white/40 text-sm">{pending} pending review · {active} active</p>
          </div>
          <button onClick={() => load(filter)}
            className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-white/12 transition-all">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'active', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all capitalize ${
                filter === s
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                  : 'bg-white/4 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
          </div>
        )}

        {!loading && carriers.length === 0 && (
          <div className="text-center py-24 text-white/30">No carrier profiles found.</div>
        )}

        {/* Carrier list */}
        <div className="space-y-3">
          {carriers.map(c => {
            const certs    = CERT_LABELS.filter(k => c[k] === true);
            const services = SVC_LABELS.filter(k => c[k] === true);
            const isOpen   = expanded === c.id;

            return (
              <div key={c.id}
                className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">

                {/* Summary row */}
                <button
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-white/4 transition-all"
                  onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-white">{c.company_name}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm truncate">
                      {c.base_location || '—'} · {c.fleet_size || '—'} · {c.email}
                    </p>
                  </div>

                  {/* Cert pills */}
                  <div className="hidden md:flex flex-wrap gap-1.5 max-w-xs">
                    {certs.slice(0, 4).map(k => (
                      <span key={k} className="text-[10px] font-bold bg-blue-500/15 border border-blue-400/25 text-blue-300 px-2 py-0.5 rounded-md">
                        {CERT_NAMES[k as string]}
                      </span>
                    ))}
                    {certs.length > 4 && (
                      <span className="text-[10px] font-bold bg-white/8 text-white/40 px-2 py-0.5 rounded-md">+{certs.length - 4}</span>
                    )}
                  </div>

                  <div className="text-white/30 text-xs whitespace-nowrap hidden md:block">
                    {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-white/6 px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                      {/* Contact */}
                      <div>
                        <h4 className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3">Contact</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-white/40">Name:</span> <span className="text-white font-semibold">{c.contact_name || '—'}</span></p>
                          <p><span className="text-white/40">Email:</span> <a href={`mailto:${c.email}`} className="text-blue-300 hover:underline">{c.email}</a></p>
                          <p><span className="text-white/40">Phone:</span> <a href={`tel:${c.phone}`} className="text-white/80">{c.phone || '—'}</a></p>
                          <p><span className="text-white/40">Base:</span> <span className="text-white/80">{c.base_location || '—'}</span></p>
                          <p><span className="text-white/40">Fleet:</span> <span className="text-white/80">{c.fleet_size || '—'}</span></p>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div>
                        <h4 className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3">Certifications</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {CERT_LABELS.map(k => (
                            <span key={k as string} className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                              c[k] ? 'bg-blue-500/15 border-blue-400/30 text-blue-300' : 'bg-white/4 border-white/8 text-white/25'
                            }`}>
                              {CERT_NAMES[k as string]}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-xs text-white/30 uppercase tracking-widest font-bold mb-3">Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {SVC_LABELS.map(k => (
                            <span key={k as string} className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                              c[k] ? 'bg-emerald-500/12 border-emerald-400/25 text-emerald-400' : 'bg-white/4 border-white/8 text-white/25'
                            }`}>
                              {SVC_NAMES[k as string]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {c.notes && (
                      <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 mb-6">
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Notes</p>
                        <p className="text-sm text-white/70">{c.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      {c.status !== 'active' && (
                        <button
                          onClick={() => updateStatus(c.id, 'active')}
                          disabled={updating === c.id}
                          className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-40">
                          {updating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Activate
                        </button>
                      )}
                      {c.status !== 'pending' && (
                        <button
                          onClick={() => updateStatus(c.id, 'pending')}
                          disabled={updating === c.id}
                          className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-400 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all disabled:opacity-40">
                          <Clock className="h-4 w-4" /> Set Pending
                        </button>
                      )}
                      {c.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(c.id, 'rejected')}
                          disabled={updating === c.id}
                          className="inline-flex items-center gap-2 bg-red-500/12 border border-red-400/25 text-red-400 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-40">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      )}
                      <a href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-2 bg-blue-500/12 border border-blue-400/25 text-blue-300 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-500/20 transition-all">
                        Email carrier
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
