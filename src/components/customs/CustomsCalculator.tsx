'use client';

import { useState } from 'react';
import {
  Loader2, Search, ShieldCheck, ShieldAlert, ShieldX,
  AlertTriangle, FileText, CreditCard,
} from 'lucide-react';

const COUNTRIES = [
  { code: 'AE', name: 'UAE / Dubai' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa' },
];

const CURRENCIES = ['GBP', 'USD', 'EUR', 'AED', 'NGN'];

interface EstimateResult {
  estimationId: string;
  category: {
    detected: string;
    confidence: number;
    hsSuggestion?: string;
    reasoning?: string;
  };
  estimate: {
    vat: number;
    duty: number;
    handling: number;
    total: number;
    landedCost: number;
    currency: string;
    breakdown: { baseValue: number; vatRate: number; dutyRate: number; handlingFee: number };
    disclaimer: string;
  };
  risk: {
    score: number;
    level: string;
    flags: string[];
    requiresAMLReview: boolean;
    requiresInvoice: boolean;
    requiresEnhancedID: boolean;
    actions: string[];
  };
}

const riskConfig: Record<string, { border: string; bg: string; text: string; label: string }> = {
  low:      { border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-700',  label: 'Low Risk' },
  medium:   { border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Medium Risk' },
  high:     { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', label: 'High Risk' },
  critical: { border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-700',    label: 'Critical Risk' },
};

function RiskIcon({ level }: { level: string }) {
  const cls = riskConfig[level]?.text ?? 'text-slate-500';
  if (level === 'critical') return <ShieldX className={`h-5 w-5 ${cls}`} />;
  if (level === 'high')     return <ShieldX className={`h-5 w-5 ${cls}`} />;
  if (level === 'medium')   return <ShieldAlert className={`h-5 w-5 ${cls}`} />;
  return <ShieldCheck className={`h-5 w-5 ${cls}`} />;
}

export default function CustomsCalculator() {
  const [form, setForm] = useState({
    itemDescription: '',
    brand: '',
    declaredValue: '',
    currency: 'GBP',
    originCountry: 'AE',
    destinationCountry: 'GB',
    isNew: true,
    weightKg: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<EstimateResult | null>(null);
  const [error, setError]     = useState('');

  const canSubmit = form.itemDescription.trim() && Number(form.declaredValue) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/customs/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          declaredValue: parseFloat(form.declaredValue),
          weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Estimation failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const risk = result ? (riskConfig[result.risk.level] ?? riskConfig.medium) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
        <div className="p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Duties &amp; Import Cost Estimator</h3>
          <p className="text-sm text-slate-500 mb-6">
            AI-powered landed cost estimation for international BootHop shipments.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Item + Brand */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Item Description *
                </label>
                <input
                  type="text"
                  value={form.itemDescription}
                  onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                  placeholder="e.g. Hermes Birkin handbag"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Hermes, Rolex, Apple"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Value + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Declared Value *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.declaredValue}
                  onChange={(e) => setForm({ ...form, declaredValue: e.target.value })}
                  placeholder="e.g. 1500"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Route */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">From *</label>
                <select
                  value={form.originCountry}
                  onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">To *</label>
                <select
                  value={form.destinationCountry}
                  onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Condition + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition</label>
                <select
                  value={form.isNew ? 'new' : 'used'}
                  onChange={(e) => setForm({ ...form, isNew: e.target.value === 'new' })}
                  className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="new">New</option>
                  <option value="used">Used / Pre-owned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Weight kg (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  placeholder="1.2"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                canSubmit && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing with AI...</>
              ) : (
                <><Search className="h-4 w-4" /> Estimate Duties &amp; Import Costs</>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="border-t border-slate-100 px-8 py-5">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && risk && (
          <div className="border-t border-slate-100">
            {/* AI Category Badge */}
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
                  AI Detected Category
                </p>
                <p className="font-semibold text-slate-900 capitalize">
                  {result.category.detected.replace(/_/g, ' ')}
                  {result.category.hsSuggestion && (
                    <span className="text-xs text-slate-400 ml-2 font-normal">
                      HS: {result.category.hsSuggestion}xx
                    </span>
                  )}
                </p>
                {result.category.reasoning && (
                  <p className="text-xs text-slate-500 mt-0.5">{result.category.reasoning}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">AI Confidence</p>
                <p className="text-xl font-bold text-slate-900">
                  {Math.round(result.category.confidence * 100)}%
                </p>
              </div>
            </div>

            <div className="px-8 py-6 space-y-4">
              {/* Duty Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <p className="font-semibold text-sm">Estimated Import Charges</p>
                  <p className="text-xs text-slate-400">
                    {form.originCountry} to {form.destinationCountry}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between px-5 py-3 text-sm">
                    <span className="text-slate-500">Declared Value (GBP equivalent)</span>
                    <span className="font-medium">
                      £{result.estimate.breakdown.baseValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between px-5 py-3 text-sm">
                    <span className="text-slate-500">
                      Import Duty ({result.estimate.breakdown.dutyRate}%)
                    </span>
                    <span className="font-medium">£{result.estimate.duty.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3 text-sm">
                    <span className="text-slate-500">
                      VAT ({result.estimate.breakdown.vatRate}%)
                    </span>
                    <span className="font-medium">£{result.estimate.vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3 text-sm">
                    <span className="text-slate-500">Handling Fee</span>
                    <span className="font-medium">
                      £{result.estimate.handling.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between px-5 py-3 bg-slate-50">
                    <span className="font-bold text-slate-900">Total Import Charges</span>
                    <span className="font-bold text-slate-900 text-lg">
                      £{result.estimate.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between px-5 py-3 bg-blue-50">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" /> Estimated Landed Cost
                    </span>
                    <span className="font-bold text-blue-700 text-lg">
                      £{result.estimate.landedCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Panel */}
              <div className={`rounded-2xl border ${risk.border} ${risk.bg} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RiskIcon level={result.risk.level} />
                    <p className={`font-semibold text-sm ${risk.text}`}>{risk.label}</p>
                  </div>
                  <span className={`text-xs font-bold ${risk.text}`}>
                    Score: {result.risk.score}/100
                  </span>
                </div>

                {result.risk.actions.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {result.risk.actions.map((action, i) => (
                      <li key={i} className={`text-xs flex items-start gap-1.5 ${risk.text}`}>
                        <span className="mt-0.5 flex-shrink-0">&#x2192;</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {result.risk.requiresInvoice && (
                    <span className={`inline-flex items-center gap-1 text-xs bg-white/70 border ${risk.border} rounded-full px-3 py-1 font-medium ${risk.text}`}>
                      <FileText className="h-3 w-3" /> Invoice Required
                    </span>
                  )}
                  {result.risk.requiresEnhancedID && (
                    <span className={`inline-flex items-center gap-1 text-xs bg-white/70 border ${risk.border} rounded-full px-3 py-1 font-medium ${risk.text}`}>
                      Enhanced ID Verification
                    </span>
                  )}
                  {result.risk.requiresAMLReview && (
                    <span className={`inline-flex items-center gap-1 text-xs bg-white/70 border ${risk.border} rounded-full px-3 py-1 font-medium ${risk.text}`}>
                      AML Review Queued
                    </span>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
                {result.estimate.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
