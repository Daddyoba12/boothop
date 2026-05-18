import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Download, Shield, ArrowLeft } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Carrier & Traveller Agreement | BootHop',
  description: 'Legal agreement for all BootHop carriers and travellers carrying shipments on our platform.',
};

export default function CarrierAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <NavBar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to BootHop
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <Shield className="h-3.5 w-3.5" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Carrier & Traveller Agreement</h1>
          <p className="text-slate-400 text-lg">Last Updated: May 18, 2026</p>
        </div>

        {/* Download button */}
        <div className="flex flex-wrap gap-4 mb-12">
          <a
            href="/docs/carrier-agreement.docx"
            download
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
          >
            <Download className="h-4 w-4" /> Download Full Agreement (.docx)
          </a>
          <a
            href="/docs/general-terms-of-service.pdf"
            download
            className="inline-flex items-center gap-2 border border-white/20 text-white/70 font-semibold px-6 py-3 rounded-xl hover:border-white/40 hover:text-white transition-all duration-300"
          >
            <FileText className="h-4 w-4" /> General Terms of Service (.pdf)
          </a>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-300 leading-relaxed">

          <div className="rounded-2xl border border-white/8 bg-white/3 p-8">
            <p className="text-white font-semibold mb-4">Overview</p>
            <p>This Courier and Traveller Agreement is a legally binding contract between BootHop (&quot;the Company&quot;) and you, an individual acting as a verified carrier or traveller on the BootHop platform. By registering as a carrier or traveller, you agree to be bound by the terms set out in this agreement.</p>
          </div>

          {[
            {
              title: 'Independent Contractor Status',
              body: 'The relationship between you and BootHop is that of an independent contractor. Nothing in this Agreement creates a partnership, joint venture, agency, or employer-employee relationship. You have sole discretion to accept or reject any shipment request and are responsible for your own equipment, travel arrangements, tax obligations, and insurance.'
            },
            {
              title: 'Identity & Compliance Obligations',
              body: 'You agree to submit to identity verification and background checks as required by BootHop. You must provide accurate travel itineraries and documentation, adhere to airport-enabled workflows, and comply with all AI-assisted and human-led screening processes on the platform.'
            },
            {
              title: 'Traveller Representations',
              body: 'You confirm that you are of legal age, possess valid travel documents for your route, will personally handle all shipments without delegating to unverified third parties, will maintain shipment security from pickup to delivery, and will provide tracking updates via the platform.'
            },
            {
              title: 'Customs & Legal Compliance',
              body: 'You must declare all shipments to relevant customs authorities where legally required, submit shipments to AI-assisted and manual inspections, abide by the laws of origin, transit, and destination countries, and refuse any items that appear tampered with or do not match the digital manifest.'
            },
            {
              title: 'Prohibited Items',
              body: 'You are strictly prohibited from transporting narcotics, weapons, counterfeit goods, hazardous materials, items on international sanctions lists, or any goods that would violate the laws of any country on the route. BootHop reserves the right to immediately suspend and report any carrier found in breach of this obligation.'
            },
            {
              title: 'Liability',
              body: 'You accept liability for loss, damage, or delay caused by your negligence or breach of this agreement. BootHop's liability is limited to the platform technology and does not extend to the goods being transported. Shipment insurance is available at point of booking and is strongly recommended.'
            },
            {
              title: 'Platform Rules',
              body: 'You agree not to circumvent the platform to conduct transactions directly with shippers, not to share personal contact details before they are released by BootHop, and to maintain a professional standard of conduct in all interactions with shippers and BootHop staff.'
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-2xl border border-white/8 bg-white/3 p-8">
              <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
              <p>{body}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
            <p className="text-amber-300 font-semibold mb-2">Full Agreement</p>
            <p className="text-sm">The above is a summary. The full legally binding agreement is available for download above. By using the BootHop platform as a carrier or traveller, you confirm you have read, understood, and agreed to the full terms.</p>
          </div>

          <div className="text-sm text-slate-500 pt-4 border-t border-white/8">
            <p>Questions about this agreement? Contact us at{' '}
              <a href="mailto:info@boothop.com" className="text-blue-400 hover:underline">info@boothop.com</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
