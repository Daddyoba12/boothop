import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Scale Fast: The Small Business Guide to Cross-Border Shipping in 2026 | BootHop Blog',
  description: 'Cross-border shipping for small businesses no longer has to mean high costs and customs headaches. Discover how BootHop gives small businesses access to enterprise-grade international delivery.',
  keywords: ['cross-border shipping', 'small business shipping', 'international shipping UK small business', 'cheap cross-border delivery', 'SME international logistics', 'shipping for small business'],
  openGraph: {
    title: 'The Small Business Guide to Cross-Border Shipping in 2026',
    description: 'How small businesses are shipping internationally without the cost, complexity, or customs risk of traditional couriers.',
    type: 'article',
    url: 'https://www.boothop.com/blog/small-business-cross-border-shipping',
  },
  alternates: { canonical: 'https://www.boothop.com/blog/small-business-cross-border-shipping' },
};

export default function SmallBusinessShippingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <NavBar />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">

        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          All posts
        </Link>

        <div className="flex flex-wrap gap-2 mb-5">
          {['Small Business', 'Cross-Border Shipping', 'B2B Logistics'].map(label => (
            <span key={label} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">{label}</span>
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
          Scale Fast: The Small Business Guide to Cross-Border Shipping in 2026
        </h1>

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-10 pb-8 border-b border-white/8">
          <span>BootHop Team</span>
          <span>·</span>
          <span>19 May 2026</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:text-white prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:text-slate-300">

          <p>
            For small businesses trying to reach international customers, cross-border shipping has historically been a minefield. Customs delays, unpredictable landed costs, and courier contracts designed for enterprise volumes have kept most small businesses confined to domestic markets — or forced to pass excessive shipping costs on to their customers.
          </p>
          <p>
            In 2026, that is changing. Here is what every small business owner needs to know.
          </p>

          <h2>Why Cross-Border Shipping Matters for Small Businesses</h2>
          <p>
            The UK is home to over 5.5 million small businesses. A growing number sell internationally — via Etsy, Shopify, Not on the High Street, and direct — but most still rely on Royal Mail International or standard courier contracts that are not built for low-volume, high-complexity shipments.
          </p>
          <p>
            The problem: traditional couriers are designed for scale. Their pricing, systems, and support structures assume you are shipping hundreds of parcels a day. If you are a jeweller shipping to Lagos, a food producer sending samples to Dubai, or a designer brand fulfilling orders across Europe — you are an afterthought to their network.
          </p>

          <h2>The 5 Biggest Challenges in Small Business Cross-Border Shipping</h2>
          <p>Understanding these challenges is the first step to solving them:</p>

          <ol>
            <li><strong>High per-parcel cost</strong> — DHL, FedEx, and UPS charge a premium for low-volume international shipments. A 1kg parcel from London to Lagos can cost £45–£80 with a traditional courier on a standard rate.</li>
            <li><strong>Customs complexity</strong> — every country has different rules, restrictions, and documentation requirements. Getting it wrong means delays, additional charges, or rejected shipments.</li>
            <li><strong>Unpredictable delivery times</strong> — "3–7 business days" can become three weeks when customs intervenes, or during peak periods.</li>
            <li><strong>No relationship with the carrier</strong> — when something goes wrong, you're dealing with a call centre, not someone who cares about your parcel.</li>
            <li><strong>Volume minimums</strong> — most couriers won't negotiate business rates unless you're shipping 50+ parcels per month, which excludes the majority of small businesses.</li>
          </ol>

          <h2>How BootHop Changes the Equation for Small Business Shipping</h2>
          <p>
            BootHop is built around the idea that the best carrier for your parcel is already making that journey. Verified travellers and couriers — people who are already flying or driving to your destination — carry your parcel as part of their existing journey.
          </p>
          <p>This means:</p>
          <ul>
            <li><strong>No minimum volumes</strong> — send one parcel or fifty, the process is the same</li>
            <li><strong>Transparent pricing</strong> — you set your budget, carriers name their price, you agree before anything moves</li>
            <li><strong>Human carriers</strong> — a verified individual who has accepted personal responsibility for your parcel</li>
            <li><strong>Compliance built in</strong> — customs pre-screening on every shipment before handoff</li>
            <li><strong>Same-day and next-flight options</strong> — for time-sensitive orders that cannot wait</li>
          </ul>

          <h2>Real Routes, Real Savings</h2>
          <p>
            A boutique jeweller sending a 0.5kg parcel from Birmingham to Lagos: BootHop rate £18–£28 versus DHL International at £55–£75.
          </p>
          <p>
            A food producer sending a 2kg sample box from London to Dubai: BootHop rate £32–£48 versus FedEx International Priority at £90+.
          </p>
          <p>
            The savings compound when you factor in BootHop's compliance support — fewer rejected shipments, fewer customs holds, and documentation guidance that would otherwise require a freight forwarder or customs broker.
          </p>

          <h2>What to Look for in a Cross-Border Shipping Partner</h2>
          <p>Not all shipping solutions are equal. Here are the criteria that matter most for small businesses:</p>
          <ul>
            <li><strong>Pre-departure customs screening</strong> — catches problems before they become border incidents</li>
            <li><strong>Chain of custody documentation</strong> — essential for insurance, disputes, and compliance audits</li>
            <li><strong>Escrow payment protection</strong> — funds held until delivery is confirmed; neither party can disappear with the goods or the money</li>
            <li><strong>Carrier verification</strong> — identity-verified carriers reduce the risk of theft, mishandling, or no-show</li>
            <li><strong>No lock-in</strong> — pay per shipment, no annual contracts or minimum volumes</li>
          </ul>

          <h2>Getting Started as a Small Business on BootHop</h2>
          <p>
            BootHop's Business Portal is designed for growing companies that need flexibility without enterprise overhead:
          </p>
          <ol>
            <li>Post your delivery job with route, item description, and required date</li>
            <li>Get matched with a verified carrier heading in the right direction</li>
            <li>Approve the quoted price</li>
            <li>Arrange handoff at a convenient location, or request door collection</li>
            <li>Track status and confirm delivery — funds release automatically on confirmation</li>
          </ol>
          <p>
            Every shipment comes with a digital audit trail — useful for customer service, insurance, and tax records.
          </p>

          <h2>The Bottom Line</h2>
          <p>
            Cross-border shipping for small businesses does not have to be expensive, complicated, or unreliable. BootHop gives independent businesses access to a compliance-first delivery network that was previously only available to large enterprises with dedicated logistics teams.
          </p>
          <p>
            Free to join. No subscription. No minimum volume. <Link href="/business">Post your first international delivery today.</Link>
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-white/8">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">Start shipping internationally today</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">No subscription. No minimum volume. Compliance-screened carriers on every route.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/business" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-7 py-3 rounded-full text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]">
                Business Portal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 border border-white/20 text-white/70 hover:text-white px-7 py-3 rounded-full text-sm transition-all">
                Send a package →
              </Link>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
