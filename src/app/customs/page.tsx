'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, Activity,
  ChevronDown, ChevronUp, Globe, AlertTriangle, CheckCircle2,
  XCircle, Info, Package, FileText, Search,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CheckResult {
  item:        string;
  country:     string;
  category:    string;
  riskScore:   number;
  rulesStatus: string;
  decision: {
    status:  string;
    action:  string;
    label:   string;
    color:   'green' | 'amber' | 'red';
    message: string;
  };
  breakdown: {
    itemScore:     number;
    countryScore:  number;
    userScore:     number;
    valueScore:    number;
    quantityScore: number;
  };
}

// ── Country data ───────────────────────────────────────────────────────────────
const countries = [
  'United Kingdom','Nigeria','United States','Canada','Germany','France',
  'UAE','Saudi Arabia','China','India','Australia','South Africa',
  'Kenya','Ghana','Netherlands','Italy','Spain','Ireland','Singapore','Japan',
];

const countryTier: Record<string, 'strict' | 'moderate' | 'standard'> = {
  'UAE': 'strict', 'Saudi Arabia': 'strict', 'Singapore': 'strict',
  'China': 'moderate', 'Nigeria': 'moderate', 'India': 'moderate',
};

const tierLabel = { strict: 'Strict', moderate: 'Moderate', standard: 'Standard' };
const tierColor = {
  strict:   'bg-red-100 text-red-700',
  moderate: 'bg-amber-100 text-amber-700',
  standard: 'bg-green-100 text-green-700',
};

// ── Color map ──────────────────────────────────────────────────────────────────
const colorMap = {
  green: {
    icon:   <ShieldCheck className="h-6 w-6" />,
    bg:     'bg-green-50', border: 'border-green-200',
    text:   'text-green-700', bar: 'bg-green-500',
    badge:  'bg-green-100 text-green-800',
  },
  amber: {
    icon:   <ShieldAlert className="h-6 w-6" />,
    bg:     'bg-amber-50', border: 'border-amber-200',
    text:   'text-amber-700', bar: 'bg-amber-500',
    badge:  'bg-amber-100 text-amber-800',
  },
  red: {
    icon:   <ShieldX className="h-6 w-6" />,
    bg:     'bg-red-50', border: 'border-red-200',
    text:   'text-red-700', bar: 'bg-red-500',
    badge:  'bg-red-100 text-red-800',
  },
};

// ── Documents by status ────────────────────────────────────────────────────────
const docsForStatus: Record<string, { name: string; desc: string }[]> = {
  ALLOWED: [
    { name: 'Commercial / Gift Invoice',    desc: 'Required for all international parcels — list item, value and purpose.' },
    { name: 'Packing List',                 desc: 'Contents, quantity and weight of the parcel.' },
  ],
  RESTRICTED: [
    { name: 'Commercial / Gift Invoice',    desc: 'Required for all international parcels.' },
    { name: 'Packing List',                 desc: 'Contents, quantity and weight.' },
    { name: 'Import / Export Licence',      desc: 'May be required for restricted goods — check destination country rules.' },
    { name: 'Health / Phytosanitary Cert',  desc: 'Required for food, plants or animal products.' },
    { name: 'Prescription (if applicable)', desc: 'Required for medications or controlled substances.' },
  ],
  PROHIBITED: [],
};

// ══════════════════════════════════════════════════════════════════════════════
export default function CustomsPage() {
  const [item,      setItem]      = useState('');
  const [country,   setCountry]   = useState('');
  const [value,     setValue]     = useState('');
  const [quantity,  setQuantity]  = useState('1');
  const [result,    setResult]    = useState<CheckResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const canCheck = item.trim() && country && Number(value) > 0;

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/compliance/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item:     item.trim(),
          country,
          value:    Number(value),
          quantity: Number(quantity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Check failed');
      setResult(data as CheckResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? colorMap[result.decision.color] : null;
  const docs = result ? (docsForStatus[result.decision.status] ?? docsForStatus.ALLOWED) : [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">BootHop</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/how-it-works" className="text-slate-500 hover:text-slate-900 transition">How It Works</Link>
            <Link href="/pricing"      className="text-slate-500 hover:text-slate-900 transition">Pricing</Link>
            <Link href="/customs"      className="text-blue-600 font-semibold">Customs</Link>
            <Link href="/login"        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
            <ShieldCheck className="h-4 w-4" />
            Powered by BootHop Compliance Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Customs &amp; Declaration
            <span className="block text-blue-400 mt-1">Know Before You Ship</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
            Instantly check whether your item is allowed, restricted, or prohibited at your
            destination — powered by our own real-time compliance engine covering 20 countries.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14 space-y-14">

        {/* ── Compliance Checker ─────────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Item Compliance Checker</h2>
            <p className="text-slate-500">Enter your item details to get an instant compliance verdict and risk score.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
            <div className="p-8 space-y-5">
              {/* Item */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item Description</label>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="e.g. iPhone 15, Perfume, Vitamins, Trainers…"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Country + Value + Qty */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Destination Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select country…</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Declared Value (£)</label>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={runCheck}
                disabled={!canCheck || loading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  canCheck && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
                  : <><Search className="h-4 w-4" /> Check Compliance</>}
              </button>

              {!canCheck && (
                <p className="text-center text-xs text-slate-400">Fill in item, destination country, and declared value to run a check.</p>
              )}
            </div>

            {/* ── Result ─────────────────────────────────────────────── */}
            {error && (
              <div className="border-t border-slate-100 px-8 py-5">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {result && cfg && (
              <div className="border-t border-slate-100">
                {/* Status banner */}
                <div className={`${cfg.bg} border-b ${cfg.border} px-8 py-5 flex items-start gap-4`}>
                  <span className={cfg.text}>{cfg.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-base ${cfg.text}`}>{result.decision.label}</p>
                    <p className={`text-sm mt-0.5 ${cfg.text} opacity-90`}>{result.decision.message}</p>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-6">
                  {/* Risk score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Activity className="h-4 w-4" /> Risk Score
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{result.riskScore}<span className="text-sm text-slate-400 font-normal">/100</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className={`h-3 rounded-full ${cfg.bar} transition-all`} style={{ width: `${result.riskScore}%` }} />
                    </div>
                    {/* Breakdown */}
                    <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Item',    v: result.breakdown.itemScore },
                        { label: 'Country', v: result.breakdown.countryScore },
                        { label: 'User',    v: result.breakdown.userScore },
                        { label: 'Value',   v: result.breakdown.valueScore },
                        { label: 'Qty',     v: result.breakdown.quantityScore },
                      ].map((b) => (
                        <div key={b.label} className="bg-slate-50 rounded-lg py-2 border border-slate-100">
                          <p className="text-xs text-slate-400">{b.label}</p>
                          <p className="text-sm font-bold text-slate-700">+{b.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category pill */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Item Category</span>
                    <span className="capitalize text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                      {result.category}
                    </span>
                  </div>

                  {/* Documents required */}
                  {docs.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" /> Required Documents
                      </p>
                      <ul className="space-y-2.5">
                        {docs.map((d) => (
                          <li key={d.name} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.decision.action === 'BLOCK' && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">
                        This item cannot be shipped via BootHop to this destination. Please choose a different item or destination.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How Our Compliance Engine Works</h2>
            <p className="text-slate-500">Five factors combine to give every shipment a precise risk score.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: <Package className="h-5 w-5" />,      title: 'Item Type',       desc: 'Weapon, drug, food, electronics and 11 more categories — each carries a base risk.' },
              { icon: <Globe className="h-5 w-5" />,         title: 'Country Tier',    desc: 'Strict, Moderate, or Standard — reflects how closely the destination enforces rules.' },
              { icon: <ShieldCheck className="h-5 w-5" />,   title: 'User Profile',    desc: 'Verified & experienced users benefit from a lower risk contribution.' },
              { icon: <Activity className="h-5 w-5" />,      title: 'Declared Value',  desc: 'Higher-value goods face increased scrutiny at customs.' },
              { icon: <Info className="h-5 w-5" />,          title: 'Quantity',        desc: 'Bulk quantities may trigger commercial import rules.' },
            ].map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-3">
                  {s.icon}
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Decision levels ────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Decision Levels</h2>
            <p className="text-slate-500">Every check returns one of three outcomes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon:   <ShieldCheck className="h-7 w-7 text-green-600" />,
                label:  'Allowed',
                score:  'Score 0–49',
                color:  'border-green-200 bg-green-50',
                text:   'text-green-700',
                bullet: 'bg-green-400',
                points: [
                  'No import restrictions found',
                  'Standard documents apply',
                  'Proceed to book your delivery',
                ],
              },
              {
                icon:   <ShieldAlert className="h-7 w-7 text-amber-600" />,
                label:  'Restricted — Admin Review',
                score:  'Score 50–79',
                color:  'border-amber-200 bg-amber-50',
                text:   'text-amber-700',
                bullet: 'bg-amber-400',
                points: [
                  'Import licence or declaration required',
                  'Flagged for admin review before matching',
                  'You may need to provide extra documents',
                ],
              },
              {
                icon:   <ShieldX className="h-7 w-7 text-red-600" />,
                label:  'Blocked',
                score:  'Score 80–100 or Prohibited',
                color:  'border-red-200 bg-red-50',
                text:   'text-red-700',
                bullet: 'bg-red-400',
                points: [
                  'Item or route is prohibited',
                  'Booking cannot proceed',
                  'Choose a different item or destination',
                ],
              },
            ].map((d) => (
              <div key={d.label} className={`rounded-2xl border ${d.color} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  {d.icon}
                  <div>
                    <p className={`font-bold text-sm ${d.text}`}>{d.label}</p>
                    <p className="text-xs text-slate-400">{d.score}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {d.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.bullet}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Country browser ────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Country Risk Tiers</h2>
            <p className="text-slate-500">Click any country to see its restrictions.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {countries.map((c) => {
              const tier = countryTier[c] ?? 'standard';
              const isOpen = expanded === c;
              return (
                <div key={c} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : c)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-800">{c}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierColor[tier]}`}>
                        {tierLabel[tier]}
                      </span>
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50 text-xs">
                      <div>
                        <p className="font-semibold text-red-600 mb-1.5 flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" /> Prohibited
                        </p>
                        <button
                          onClick={() => { setCountry(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="mt-2 text-xs text-blue-600 hover:underline font-medium"
                        >
                          Check an item for {c} →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── General guidelines ─────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> General Customs Guidelines
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                heading: 'Your Responsibilities',
                items: [
                  'Declare the true value and nature of your items',
                  'Ensure you have valid receipts or invoices for high-value goods',
                  'Comply with both the origin and destination country\'s import rules',
                  'Never ask a Booter to underdeclare or misdeclare items',
                ],
              },
              {
                heading: 'Booter (Traveller) Responsibilities',
                items: [
                  'You are legally responsible for items you carry across borders',
                  'Declare all items at customs when requested',
                  'Refuse any item you are not comfortable declaring',
                  'Keep the BootHop invoice and packing list handy',
                ],
              },
              {
                heading: 'What Counts as Personal Effects?',
                items: [
                  'Clothing, shoes and personal accessories',
                  'Small electronics for personal use (not for resale)',
                  'Books, documents and printed materials',
                  'Gifts under the destination country\'s duty-free threshold',
                ],
              },
              {
                heading: 'Prohibited Across All Routes',
                items: [
                  'Narcotics, drugs and controlled substances',
                  'Weapons, ammunition and explosives',
                  'Counterfeit or pirated goods',
                  'Live animals (unless under CITES permit)',
                ],
              },
            ].map((g) => (
              <div key={g.heading}>
                <p className="font-semibold text-slate-900 mb-3">{g.heading}</p>
                <ul className="space-y-2">
                  {g.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to Ship?</h2>
          <p className="text-blue-100 mb-7 max-w-lg mx-auto">
            Once your item passes the compliance check, post your delivery request and get matched with a verified Booter.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/requests/create"
              className="bg-white text-blue-700 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition shadow-sm"
            >
              Post a Delivery Request
            </Link>
            <Link
              href="/how-it-works"
              className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition"
            >
              How It Works
            </Link>
            <Link
              href="/customs/duties"
              className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition"
            >
              Estimate Duties &amp; VAT
            </Link>
          </div>
        </section>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-6 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} BootHop. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms"   className="hover:text-slate-900 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
            <Link href="/customs" className="text-blue-600 font-medium">Customs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
