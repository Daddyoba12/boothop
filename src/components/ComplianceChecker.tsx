'use client';

import { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2,
  ChevronDown, ChevronUp, AlertTriangle, Activity,
} from 'lucide-react';

interface ComplianceDecision {
  status:  'ALLOWED' | 'RESTRICTED' | 'PROHIBITED';
  action:  'CONTINUE' | 'ADMIN_REVIEW' | 'BLOCK';
  label:   string;
  color:   'green' | 'amber' | 'red';
  message: string;
}

interface ComplianceResult {
  item:        string;
  country:     string;
  category:    string;
  riskScore:   number;
  rulesStatus: string;
  decision:    ComplianceDecision;
  breakdown: {
    itemScore:     number;
    countryScore:  number;
    userScore:     number;
    valueScore:    number;
    quantityScore: number;
  };
}

interface Props {
  description: string;
  destination: string;
  value:       string;
  quantity?:   number;
  userId?:     string;
  onResult?:   (result: ComplianceResult) => void;
}

const colorMap = {
  green: {
    icon:   <ShieldCheck className="h-5 w-5" />,
    bg:     'bg-green-50',
    border: 'border-green-200',
    text:   'text-green-700',
    badge:  'bg-green-100 text-green-800',
    bar:    'bg-green-500',
  },
  amber: {
    icon:   <ShieldAlert className="h-5 w-5" />,
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    text:   'text-amber-700',
    badge:  'bg-amber-100 text-amber-800',
    bar:    'bg-amber-500',
  },
  red: {
    icon:   <ShieldX className="h-5 w-5" />,
    bg:     'bg-red-50',
    border: 'border-red-200',
    text:   'text-red-700',
    badge:  'bg-red-100 text-red-800',
    bar:    'bg-red-500',
  },
};

export default function ComplianceChecker({
  description, destination, value, quantity = 1, userId, onResult,
}: Props) {
  const [result,   setResult]   = useState<ComplianceResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const canCheck = description.trim() && destination && Number(value) > 0;

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/compliance/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item:     description.trim(),
          country:  destination,
          value:    Number(value),
          quantity,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Compliance check failed');

      setResult(data as ComplianceResult);
      setExpanded(true);
      onResult?.(data as ComplianceResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? colorMap[result.decision.color] : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-slate-900 text-sm">Compliance Check</span>
          {result && cfg && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
              {result.decision.label}
            </span>
          )}
        </div>
        {result && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {!result && !loading && (
          <p className="text-sm text-slate-500">
            Check import restrictions and risk score for this item and destination before submitting.
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Running compliance check…</p>
              <p className="text-xs text-slate-400">Classifying item · Checking restrictions · Calculating risk</p>
            </div>
          </div>
        )}

        {result && expanded && cfg && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`flex items-start gap-3 ${cfg.bg} border ${cfg.border} rounded-xl px-4 py-3`}>
              <span className={cfg.text}>{cfg.icon}</span>
              <p className={`text-sm font-semibold ${cfg.text}`}>{result.decision.message}</p>
            </div>

            {/* Risk score bar */}
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Risk Score</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{result.riskScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${cfg.bar}`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
              {/* Breakdown */}
              <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Item',     value: result.breakdown.itemScore },
                  { label: 'Country',  value: result.breakdown.countryScore },
                  { label: 'User',     value: result.breakdown.userScore },
                  { label: 'Value',    value: result.breakdown.valueScore },
                  { label: 'Qty',      value: result.breakdown.quantityScore },
                ].map((b) => (
                  <div key={b.label} className="bg-white rounded-lg px-2 py-1.5 border border-slate-100">
                    <p className="text-xs text-slate-400">{b.label}</p>
                    <p className="text-sm font-semibold text-slate-700">+{b.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Category:</span>
              <span className="capitalize font-medium text-slate-800">{result.category}</span>
            </div>
          </div>
        )}

        {!loading && (
          <button
            type="button"
            disabled={!canCheck}
            onClick={runCheck}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canCheck
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {result ? 'Re-run Check' : 'Check Compliance'}
          </button>
        )}

        {!canCheck && !result && (
          <p className="text-center text-xs text-slate-400">
            Fill in item description, destination, and declared value to enable this check.
          </p>
        )}
      </div>
    </div>
  );
}
