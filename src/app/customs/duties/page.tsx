import Link from 'next/link';
import CustomsCalculator from '@/components/customs/CustomsCalculator';
import { ShieldCheck, Package, Globe } from 'lucide-react';

export const metadata = {
  title: 'Duties and VAT Estimator | BootHop',
  description: 'AI-powered import duty and VAT estimation for international BootHop shipments.',
};

export default function CustomsDutiesPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">BootHop</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/how-it-works" className="text-slate-500 hover:text-slate-900 transition">How It Works</Link>
            <Link href="/customs" className="text-slate-500 hover:text-slate-900 transition">Compliance</Link>
            <Link href="/customs/duties" className="text-blue-600 font-semibold">Duties Estimator</Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            International Shipments Only
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Duties &amp; VAT Estimator
            <span className="block text-blue-400 mt-1">Know Your Landed Cost</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
            Get an instant AI-powered estimate of import duties, VAT, and total landed cost
            for your international BootHop shipment — covering UK, EU, Nigeria, UAE, USA and more.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14 space-y-14">

        {/* Info pills */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
              title: 'Correct VAT Calculation',
              desc: 'VAT applied on item value plus import duty — the legally correct landed cost method.',
            },
            {
              icon: <Globe className="h-5 w-5 text-blue-600" />,
              title: 'International Routes',
              desc: 'UK, EU, Nigeria, UAE, USA, Ghana, Kenya, South Africa and more.',
            },
            {
              icon: <Package className="h-5 w-5 text-blue-600" />,
              title: 'AI Item Classification',
              desc: 'Powered by Claude AI to detect item category and HS code automatically.',
            },
          ].map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Estimate Your Import Costs</h2>
            <p className="text-slate-500">Enter your item details and international route for an instant estimate.</p>
          </div>
          <CustomsCalculator />
        </section>

        {/* How VAT is calculated */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> How We Calculate Landed Cost
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="font-semibold text-slate-900 mb-3">The Correct VAT Formula</p>
              <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm space-y-1 text-slate-700">
                <p>1. Import Duty = Value x Duty Rate</p>
                <p>2. VAT = (Value + Duty) x VAT Rate</p>
                <p>3. Total Charges = Duty + VAT + Handling</p>
                <p className="pt-2 font-bold text-blue-700">Landed Cost = Value + Total Charges</p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                VAT is applied to the combined value of the goods and import duty — this is the correct HMRC method for UK imports.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-3">De Minimis Thresholds</p>
              <ul className="space-y-2">
                {[
                  { country: 'United Kingdom', threshold: 'Below £135', note: 'No duty or VAT below this value' },
                  { country: 'Nigeria',        threshold: 'Below £50',  note: 'Duties apply above this threshold' },
                  { country: 'EU Countries',   threshold: 'Below €150', note: 'Post-Brexit EU import threshold' },
                  { country: 'United States',  threshold: 'Below $800', note: 'Section 321 de minimis' },
                ].map((d) => (
                  <li key={d.country} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{d.country} — {d.threshold}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white">
          <h2 className="text-2xl font-bold mb-3">Need to Check Compliance First?</h2>
          <p className="text-blue-100 mb-7 max-w-lg mx-auto">
            Before estimating duties, make sure your item is allowed at the destination country.
          </p>
          <Link
            href="/customs"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Run a Compliance Check
          </Link>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-6 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} BootHop. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms"          className="hover:text-slate-900 transition">Terms</Link>
            <Link href="/privacy"        className="hover:text-slate-900 transition">Privacy</Link>
            <Link href="/customs"        className="hover:text-slate-900 transition">Compliance</Link>
            <Link href="/customs/duties" className="text-blue-600 font-medium">Duties Estimator</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
