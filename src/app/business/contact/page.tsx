'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MessageCircle, Send, CheckCircle, Loader2,
  Building2, ChevronLeft, Star, Phone,
} from 'lucide-react';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function BusinessContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const submit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          topic: 'Business Enquiry',
          message: form.message,
        }),
      });
      setStatus(res.ok ? 'ok' : 'err');
      if (res.ok) setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <a
            href="/business"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Business
          </a>
        </div>
        <div className="text-xl font-black tracking-tight">
          Boot<span className="text-emerald-400">Hop</span>
          <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Business
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-12 text-center">
        <motion.div
          {...FADE}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest"
        >
          <Mail className="h-3.5 w-3.5" /> Business Enquiries
        </motion.div>
        <motion.h1
          {...FADE}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-5"
        >
          Get in <span className="text-emerald-400">touch</span>
        </motion.h1>
        <motion.p
          {...FADE}
          transition={{ delay: 0.15 }}
          className="text-white/50 text-xl max-w-xl mx-auto leading-relaxed"
        >
          Questions about business deliveries, pricing, or the Priority Partner programme?
          We reply within 24 hours.
        </motion.p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-8">

          {/* ── Left: contact info ── */}
          <motion.div {...FADE} transition={{ delay: 0.18 }} className="space-y-4">

            {/* Email card */}
            <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-white font-bold group-hover:text-emerald-300 transition-colors duration-300">
                  Email
                </p>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                For business enquiries, partnerships, and account questions.
              </p>
              <a
                href="mailto:business@boothop.com"
                className="inline-block mt-3 text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors"
              >
                business@boothop.com
              </a>
            </div>

            {/* WhatsApp card */}
            <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                </div>
                <p className="text-white font-bold group-hover:text-emerald-300 transition-colors duration-300">
                  WhatsApp
                </p>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-3">
                Fastest way to reach us. Chat directly with the business team.
              </p>
              <a
                href="/api/whatsapp"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#1ebe5d] transition-all"
              >
                <Phone className="h-3.5 w-3.5" /> Chat on WhatsApp
              </a>
            </div>

            {/* Priority Partner card (amber) */}
            <a
              href="/business/priority-partner"
              className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 block transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
            >
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white font-bold group-hover:text-amber-300 transition-colors duration-300">
                  Priority Partner
                </p>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                For dedicated accounts, retainer pricing, and enterprise logistics. Apply for a Priority Partnership.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-3 text-amber-400 text-xs font-black">
                <Building2 className="h-3.5 w-3.5" /> Apply for Priority Partner →
              </span>
            </a>
          </motion.div>

          {/* ── Right: contact form ── */}
          <motion.div {...FADE} transition={{ delay: 0.22 }}>
            <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Send className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-white font-bold">Send a message</p>
              </div>

              {status === 'ok' ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-10 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-white font-bold text-lg">Message sent!</p>
                  <p className="text-white/40 text-sm mt-2">We&apos;ll be in touch shortly.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-5 text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors"
                  >
                    Send another →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {status === 'err' && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                      Could not send message. Please try WhatsApp instead.
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 block mb-2">
                      Your name
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 block mb-2">
                      Business email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@yourcompany.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 block mb-2">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="How can we help?"
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={submit}
                    disabled={loading || !form.name || !form.email || !form.message}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all text-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-white/25 text-sm mt-6">
              or{' '}
              <a href="/business" className="text-white/40 hover:text-white transition-colors font-semibold">
                sign in directly
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
