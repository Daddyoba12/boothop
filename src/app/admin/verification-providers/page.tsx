'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Globe, Phone, Mail, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';

const PROVIDER_TYPES = [
  'approved_inspection_partner',
  'regulated_courier_facility',
  'customs_broker',
  'cargo_screening_facility',
  'authorised_security_screening_provider',
  'airline_or_airport_cargo_facility',
  'other_legally_authorised_provider',
] as const;

type ProviderType = (typeof PROVIDER_TYPES)[number];

interface Provider {
  id:                 string;
  name:               string;
  provider_type:      ProviderType;
  country:            string;
  city:               string | null;
  address:            string | null;
  email:              string | null;
  phone:              string | null;
  supported_services: string[];
  active:             boolean;
  instructions:       string | null;
  created_at:         string;
}

const EMPTY_FORM = {
  name:         '',
  provider_type: PROVIDER_TYPES[0] as ProviderType,
  country:       '',
  city:          '',
  address:       '',
  email:         '',
  phone:         '',
  instructions:  '',
  active:        true,
};

export default function VerificationProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<Provider | null>(null);
  const [form,      setForm]      = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Filters
  const [filterCountry, setFilterCountry] = useState('');
  const [filterActive,  setFilterActive]  = useState<'all' | 'true' | 'false'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCountry) params.set('country', filterCountry);
    if (filterActive !== 'all') params.set('active', filterActive);
    const res = await fetch(`/api/admin/verification-providers?${params}`);
    if (res.ok) {
      const j = await res.json();
      setProviders(j.providers ?? []);
    }
    setLoading(false);
  }, [filterCountry, filterActive]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({
      name:          p.name,
      provider_type: p.provider_type,
      country:       p.country,
      city:          p.city ?? '',
      address:       p.address ?? '',
      email:         p.email ?? '',
      phone:         p.phone ?? '',
      instructions:  p.instructions ?? '',
      active:        p.active,
    });
    setError(null);
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const url    = editing ? `/api/admin/verification-providers/${editing.id}` : '/api/admin/verification-providers';
      const method = editing ? 'PATCH' : 'POST';
      const body   = {
        ...form,
        city:         form.city.trim()         || null,
        address:      form.address.trim()       || null,
        email:        form.email.trim()         || null,
        phone:        form.phone.trim()         || null,
        instructions: form.instructions.trim()  || null,
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? 'Save failed');
        return;
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Provider) => {
    await fetch(`/api/admin/verification-providers/${p.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: !p.active }),
    });
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/compliance" className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Verification Providers</h1>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" /> Add provider
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Filter by country…"
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value as 'all' | 'true' | 'false')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        {/* Provider list */}
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No providers found</p>
            <p className="text-sm mt-1">Add your first verification provider using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className={`bg-white border rounded-2xl p-5 ${p.active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">{p.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {p.provider_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {p.country}{p.city ? `, ${p.city}` : ''}</span>
                      {p.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.address}</span>}
                      {p.email   && <span className="flex items-center gap-1"><Mail  className="h-3.5 w-3.5" /> {p.email}</span>}
                      {p.phone   && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.phone}</span>}
                    </div>
                    {p.instructions && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.instructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.active ? 'Deactivate' : 'Activate'}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {p.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{editing ? 'Edit provider' : 'Add provider'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Name *</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Provider type *</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.provider_type} onChange={e => setForm(f => ({ ...f, provider_type: e.target.value as ProviderType }))}>
                  {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Country *</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. Nigeria" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">City</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Lagos" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Address</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Phone</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+234…" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Instructions</label>
                <textarea rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="What should the sender bring / expect…" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-slate-700">Active (shown to users)</span>
              </label>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add provider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
