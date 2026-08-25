'use client';

import { useState } from 'react';
import type { SafetyCheckResponse } from '@/app/api/ai/safety-check/route';

const COUNTRIES = [
  'United Kingdom', 'Nigeria', 'United States', 'Canada', 'Germany',
  'France', 'Ghana', 'Kenya', 'South Africa', 'India', 'Australia',
  'United Arab Emirates', 'Jamaica', 'Brazil', 'Poland', 'Italy',
  'Spain', 'Netherlands', 'Sweden', 'China',
];

const VERDICT_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  PERMITTED:       { bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: '✓' },
  RESTRICTED:      { bg: 'bg-amber-950/60',   border: 'border-amber-500/40',   text: 'text-amber-400',   icon: '⚠' },
  PROHIBITED:      { bg: 'bg-red-950/60',      border: 'border-red-500/40',     text: 'text-red-400',     icon: '✗' },
  REVIEW_REQUIRED: { bg: 'bg-blue-950/60',     border: 'border-blue-500/40',    text: 'text-blue-400',    icon: '?' },
};

export default function AICheckPage() {
  const [item,        setItem]        = useState('');
  const [fromCountry, setFromCountry] = useState('United Kingdom');
  const [toCountry,   setToCountry]   = useState('');
  const [value,       setValue]       = useState('');
  const [question,    setQuestion]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<SafetyCheckResponse | null>(null);
  const [error,       setError]       = useState('');

  async function handleCheck() {
    if (!item.trim() || !toCountry) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/ai/safety-check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item:        item.trim(),
          fromCountry,
          toCountry,
          value:       value ? parseFloat(value) : 0,
          quantity:    1,
          question:    question.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Check failed. Please try again.');
      const data: SafetyCheckResponse = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const style = result ? (VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.REVIEW_REQUIRED) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] to-[#0c1e3d] px-4 py-16">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI Safety Assistant
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Can I send this?</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Describe what you want to send and where. Our AI checks customs rules,<br />
            airline restrictions, and BootHop policy in seconds.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">

          {/* Item */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              What do you want to send?
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. a Samsung phone, prescription medication, jollof rice..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
            />
          </div>

          {/* Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">From</label>
              <select
                value={fromCountry}
                onChange={(e) => setFromCountry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c1e3d] px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">To</label>
              <select
                value={toCountry}
                onChange={(e) => setToCountry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c1e3d] px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition"
              >
                <option value="">Select destination</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Value + optional question */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Estimated value (£) <span className="text-white/25">optional</span>
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 150"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Specific question <span className="text-white/25">optional</span>
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Does it need a receipt?"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/50 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCheck}
            disabled={loading || !item.trim() || !toCountry}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking...
              </>
            ) : (
              'Check Now'
            )}
          </button>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Result */}
        {result && style && (
          <div className={`mt-6 rounded-2xl border ${style.border} ${style.bg} p-6 space-y-5`}>

            {/* Verdict badge */}
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${style.border} text-lg font-bold ${style.text}`}>
                {style.icon}
              </div>
              <div>
                <p className={`text-base font-bold ${style.text}`}>{result.verdictLabel}</p>
                <p className="text-xs text-white/40">
                  Risk score: {result.riskScore}/100 · Category: {result.category}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-white/80 leading-relaxed">{result.explanation}</p>

            {/* Tips */}
            {result.tips.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Tips</p>
                <ul className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/65">
                      <span className={`mt-0.5 shrink-0 ${style.text}`}>›</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Review required banner */}
            {result.requiresReview && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
                This item has been flagged for manual review. A member of the BootHop team
                will check it before your delivery is confirmed.
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-white/25 leading-relaxed border-t border-white/8 pt-4">
              {result.disclaimer}
            </p>

            {/* CTA */}
            <div className="flex gap-3 pt-1">
              <a
                href="/journeys/create"
                className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500 transition"
              >
                Post a Journey
              </a>
              <a
                href="/contact"
                className="flex-1 rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* Examples */}
        {!result && (
          <div className="mt-8">
            <p className="text-xs font-medium text-white/30 text-center mb-4">Try an example</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                ['Samsung phone', 'Nigeria'],
                ['Jollof rice', 'United States'],
                ['Prescription medicine', 'United Kingdom'],
                ['Perfume', 'Germany'],
                ['Gold jewellery', 'Ghana'],
              ].map(([exItem, exCountry]) => (
                <button
                  key={exItem}
                  onClick={() => { setItem(exItem); setToCountry(exCountry); }}
                  className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition"
                >
                  {exItem} → {exCountry}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
