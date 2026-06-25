'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Video, Zap, Globe } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

type Step = 'form' | 'success';

const inputClass = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/40 transition-all text-sm";
const labelClass = "block text-xs font-medium text-white/50 mb-1.5";

export default function PipelineOnboardPage() {
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    location: '',
    website: '',
    description: '',
    brandTone: '',
    contentThemes: '',
    email: '',
    whatsapp: '',
    telegram: '',
    postsPerDay: '2-3',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.businessName || !form.email) {
      setError('Business name and email are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await fetch('/api/pipeline/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Something went wrong. Please try again.');
      return;
    }
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">

      {/* Nav */}
      <nav className="border-b border-white/8 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/"><BootHopLogo size="md" /></Link>
          <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">← Back to BootHop</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">

        {step === 'success' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-semibold text-white mb-3">You&apos;re on the list</h1>
            <p className="text-white/50 text-base mb-2">We&apos;ve received your details for <strong className="text-white">{form.businessName}</strong>.</p>
            <p className="text-white/40 text-sm mb-10">We&apos;ll be in touch within 24 hours to get your content pipeline set up.</p>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-400 transition-all">
              Back to BootHop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-5">
                <Video className="h-3.5 w-3.5" /> BootHop Content Pipeline
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
                Get your business posting every day.
              </h1>
              <p className="text-white/50 text-base leading-relaxed">
                Fill in the details below and we&apos;ll set up a fully automated TikTok &amp; Instagram content pipeline for your business — delivering videos to you daily.
              </p>
            </div>

            {/* What you get */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { icon: <Video className="h-4 w-4" />, label: 'Daily videos', sub: 'TikTok & Instagram' },
                { icon: <Zap className="h-4 w-4" />, label: 'Auto-posted', sub: 'Or sent to Telegram' },
                { icon: <Globe className="h-4 w-4" />, label: 'Your brand', sub: 'Custom hooks & voice' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <div className="flex justify-center mb-2 text-blue-400">{icon}</div>
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-white/35 text-[10px] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 space-y-5">

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Business name *</label>
                  <input value={form.businessName} onChange={set('businessName')} placeholder="e.g. G-Inspired" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Business type</label>
                  <input value={form.businessType} onChange={set('businessType')} placeholder="e.g. Resale store, Restaurant, Gym" className={inputClass} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Location (city, country)</label>
                  <input value={form.location} onChange={set('location')} placeholder="e.g. Chicago, Illinois, USA" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Website or social handle</label>
                  <input value={form.website} onChange={set('website')} placeholder="e.g. g-inspired.com or @ginspired" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Tell us about your business</label>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder="What do you sell? Who are your customers? What makes you different?"
                  className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className={labelClass}>Brand voice / tone</label>
                <textarea value={form.brandTone} onChange={set('brandTone')} rows={2}
                  placeholder="e.g. Fun and energetic, professional and trustworthy, community-focused..."
                  className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className={labelClass}>Content themes or ideas (optional)</label>
                <textarea value={form.contentThemes} onChange={set('contentThemes')} rows={2}
                  placeholder="Any specific products, events, or themes you want to highlight?"
                  className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className={labelClass}>Posts per day</label>
                <select value={form.postsPerDay} onChange={set('postsPerDay')} className={inputClass}>
                  <option value="1-2" className="bg-slate-900">1–2 posts/day</option>
                  <option value="2-3" className="bg-slate-900">2–3 posts/day</option>
                  <option value="3-5" className="bg-slate-900">3–5 posts/day</option>
                  <option value="5+" className="bg-slate-900">5+ posts/day</option>
                </select>
              </div>

              <div className="border-t border-white/8 pt-5 space-y-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Contact details</p>
                <div>
                  <label className={labelClass}>Email address *</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" className={inputClass} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>WhatsApp number</label>
                    <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+1 312 000 0000" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Telegram username</label>
                    <input value={form.telegram} onChange={set('telegram')} placeholder="@yourusername" className={inputClass} />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-4 text-sm font-bold text-white hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Sending...' : <>Submit — Get me set up <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs text-white/25">We&apos;ll review your details and get back to you within 24 hours.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
