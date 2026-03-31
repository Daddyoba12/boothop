'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const topics = [
  'General enquiry',
  'Account / login issue',
  'Problem with a delivery',
  'Payment or refund',
  'Report a user',
  'KYC / verification issue',
  'Technical bug',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.topic || !form.message) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <BootHopLogo iconClass="text-slate-900" textClass="text-slate-900" />
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-14 px-6 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100">
          <MessageCircle className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">Contact Us</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">Get in touch</h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Have a question or a problem? We're here to help. Fill in the form below and we'll get back to you as quickly as we can.
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-5 gap-10">

        {/* INFO SIDEBAR */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">Email Support</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              You can also reach us directly at{' '}
              <a href="mailto:support@boothop.co.uk" className="text-blue-600 font-medium hover:underline">
                support@boothop.co.uk
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900">Response Times</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />General queries: within 24 hrs</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />Active delivery issues: within 6 hrs</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />Urgent safety reports: within 2 hrs</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <h3 className="font-bold text-slate-900 mb-3">Support Hours</h3>
            <p className="text-sm text-slate-500">Monday – Friday: 9am – 6pm GMT</p>
            <p className="text-sm text-slate-500 mt-1">Weekend: Limited support</p>
            <p className="text-xs text-slate-400 mt-3">For urgent delivery issues, we monitor messages 7 days a week.</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
            <h3 className="font-bold text-slate-900 mb-2">Before you contact us</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Many questions are answered in our{' '}
              <Link href="/help" className="font-semibold underline">Help Centre</Link>.
              Check there first for a faster answer.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="md:col-span-3">
          {status === 'sent' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Message sent!</h2>
              <p className="text-slate-500 text-sm mb-6">We'll be in touch within 24 hours on business days.</p>
              <button onClick={() => { setForm({ name: '', email: '', topic: '', message: '' }); setStatus('idle'); }}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-8 space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-1">Send a message</h2>
              <p className="text-sm text-slate-500 mb-2">All fields are required.</p>

              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">Something went wrong. Please email us directly at support@boothop.co.uk</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email address</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Topic</label>
                <select required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls}>
                  <option value="">Select a topic...</option>
                  {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Message</label>
                <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6} placeholder="Describe your question or issue in as much detail as possible..."
                  className={`${inputCls} resize-none`} />
              </div>

              <button type="submit" disabled={status === 'sending'}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                {status === 'sending' ? 'Sending...' : 'Send message'}
              </button>
              <p className="text-xs text-slate-400 text-center">By submitting you agree to our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 px-6 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} BootHop. All rights reserved.</p>
        <div className="mt-3 flex justify-center gap-5">
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Help', '/help']].map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white transition">{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
