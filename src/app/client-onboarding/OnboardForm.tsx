'use client';

import { useState } from 'react';

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'blog'];

interface Profile {
  business_name:  string;
  contact_name:   string;
  email:          string;
  phone:          string;
  website:        string;
  bio:            string;
  platforms_json: string;
  tg_chat_id:     string;
  whatsapp:       string;
  custom_1_label: string; custom_1_value: string;
  custom_2_label: string; custom_2_value: string;
  custom_3_label: string; custom_3_value: string;
  custom_4_label: string; custom_4_value: string;
}

function empty(): Profile {
  return {
    business_name: '', contact_name: '', email: '', phone: '',
    website: '', bio: '', platforms_json: '[]', tg_chat_id: '', whatsapp: '',
    custom_1_label: '', custom_1_value: '',
    custom_2_label: '', custom_2_value: '',
    custom_3_label: '', custom_3_value: '',
    custom_4_label: '', custom_4_value: '',
  };
}

export default function OnboardForm({ clientId, profile }: { clientId: string; profile: Profile | null }) {
  const [form,    setForm]    = useState<Profile>(profile ?? empty());
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const platforms: string[] = (() => { try { return JSON.parse(form.platforms_json); } catch { return []; } })();

  function set(field: keyof Profile, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function togglePlatform(p: string) {
    const next = platforms.includes(p) ? platforms.filter(x => x !== p) : [...platforms, p];
    set('platforms_json', JSON.stringify(next));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res  = await fetch('/api/commander/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setMsg({ ok: true, text: 'Profile saved successfully.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
    }
    setBusy(false);
  }

  const inputClass = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all';
  const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <form onSubmit={save} className="space-y-6">

      {/* Core fields */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Company Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Business Name</label>
            <input className={inputClass} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Your company name" />
          </div>
          <div>
            <label className={labelClass}>Contact Name</label>
            <input className={inputClass} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000" />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input type="url" className={inputClass} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div>
            <label className={labelClass}>Telegram Chat ID</label>
            <input className={inputClass} value={form.tg_chat_id} onChange={e => set('tg_chat_id', e.target.value)} placeholder="-100123456789" />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input type="tel" className={inputClass} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+44 7700 000000" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Bio / Brand Description</label>
          <textarea className={`${inputClass} resize-none`} rows={4} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Your brand, niche, target audience, tone of voice…" />
        </div>

        <div>
          <label className={`${labelClass} mb-2`}>Active Platforms</label>
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map(p => (
              <label key={p} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all ${platforms.includes(p) ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}>
                <input type="checkbox" className="hidden" checked={platforms.includes(p)} onChange={() => togglePlatform(p)} />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Custom fields */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Custom Fields{' '}
          <span className="text-gray-400 normal-case font-normal">— up to 4 extra details for your pipeline</span>
        </h2>

        {([1, 2, 3, 4] as const).map(n => (
          <div key={n} className="grid grid-cols-3 gap-3">
            <input
              className={inputClass}
              value={(form as any)[`custom_${n}_label`]}
              onChange={e => set(`custom_${n}_label` as keyof Profile, e.target.value)}
              placeholder="Label (e.g. Brand Tone)"
            />
            <div className="col-span-2">
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={(form as any)[`custom_${n}_value`]}
                onChange={e => set(`custom_${n}_value` as keyof Profile, e.target.value)}
                placeholder="Value…"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      {msg && (
        <div className={`rounded-xl px-5 py-3 text-sm ${msg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={busy}
          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold text-sm transition-colors">
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
        <button type="button" onClick={() => setForm(profile ?? empty())}
          className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 font-semibold text-sm transition-colors">
          Discard
        </button>
      </div>
    </form>
  );
}
