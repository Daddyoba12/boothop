'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, MessageCircle, Clock, CheckCircle, AlertCircle, ArrowRight, Sparkles, Shield } from 'lucide-react';
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

  const inputCls = 'w-full rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/10';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">

      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <BootHopLogo iconClass="text-white" textClass="text-white" />
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-all duration-300 hover:gap-3">
            ← Back
          </Link>
        </div>
      </nav>

      {/* HERO — background image with parallax */}
      <section className="relative min-h-[55vh] flex items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/betterPics.jpg)',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/50 to-slate-950/95" />

        {/* Animated ping dots */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-24 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay:'1s'}} />
          <div className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay:'2s'}} />
        </div>

        <div className="relative z-10 pt-36 pb-20 px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Contact Us</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            Get in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
              touch
            </span>
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            Have a question or a problem? We're here to help. Fill in the form below and we'll get back to you quickly.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-5 gap-10">

        {/* INFO SIDEBAR */}
        <div className="md:col-span-2 space-y-5">

          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:border-blue-500/50 hover:scale-105 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-white">Email Support</h3>
            </div>
            <p className="relative text-sm text-slate-400 leading-relaxed">
              Reach us directly at{' '}
              <a href="mailto:support@boothop.co.uk" className="text-cyan-400 font-medium hover:underline">
                support@boothop.co.uk
              </a>
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:border-emerald-500/50 hover:scale-105 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-white">Response Times</h3>
            </div>
            <ul className="relative space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />General queries: within 24 hrs</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />Active delivery issues: within 6 hrs</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />Urgent safety reports: within 2 hrs</li>
            </ul>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:border-purple-500/50 hover:scale-105 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-white">Support Hours</h3>
              </div>
              <p className="text-sm text-slate-400">Monday – Friday: 9am – 6pm GMT</p>
              <p className="text-sm text-slate-400 mt-1">Weekend: Limited support</p>
              <p className="text-xs text-slate-500 mt-3">For urgent delivery issues, we monitor messages 7 days a week.</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-900/10 backdrop-blur-sm p-6 hover:scale-105 transition-all duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-white">Before you contact us</h3>
            </div>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              Many questions are answered in our{' '}
              <Link href="/help" className="font-semibold text-amber-300 underline">Help Centre</Link>.
              Check there first for a faster answer.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="md:col-span-3">
          {status === 'sent' ? (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm p-12 text-center">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Message sent!</h2>
                <p className="text-slate-400 text-sm mb-8">We'll be in touch within 24 hours on business days.</p>
                <button
                  onClick={() => { setForm({ name: '', email: '', topic: '', message: '' }); setStatus('idle'); }}
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-8 space-y-5"
            >
              {/* Glow corner */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <h2 className="text-2xl font-black text-white mb-1">Send a message</h2>
                <p className="text-sm text-slate-400">All fields are required.</p>
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">Something went wrong. Please email us directly at support@boothop.co.uk</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 relative">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Full name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email address</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com" className={inputCls} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Topic</label>
                <select required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className={`${inputCls} cursor-pointer`}
                  style={{colorScheme:'dark'}}>
                  <option value="" className="bg-slate-900 text-slate-400">Select a topic...</option>
                  {topics.map((t) => <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Message</label>
                <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6} placeholder="Describe your question or issue in as much detail as possible..."
                  className={`${inputCls} resize-none`} />
              </div>

              <button type="submit" disabled={status === 'sending'}
                className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
                {status === 'sending' ? 'Sending...' : (
                  <>Send message <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /></>
                )}
              </button>
              <p className="text-xs text-slate-500 text-center">
                By submitting you agree to our <Link href="/privacy" className="text-slate-400 underline hover:text-white transition">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800 px-6 py-12 text-center text-sm text-slate-500">
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
