import { Cookie, Shield, BarChart2, Settings, Trash2, Mail } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cookie Policy – BootHop',
  description: 'How BootHop uses cookies and how you can control them.',
};

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: any; children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-blue-500/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.97] transition-all duration-300 p-7 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
        <div className="relative space-y-4 text-sm text-slate-400 leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

function Row({ name, type, purpose, expiry }: { name: string; type: string; purpose: string; expiry: string }) {
  return (
    <tr className="hover:bg-white/3 transition-colors">
      <td className="p-3 font-mono text-cyan-400 text-xs">{name}</td>
      <td className="p-3 text-slate-300">{type}</td>
      <td className="p-3 text-slate-400">{purpose}</td>
      <td className="p-3 text-slate-500">{expiry}</td>
    </tr>
  );
}

export default function CookiePolicyPage() {
  const lastUpdated = '31 March 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">

      {/* ANIMATED BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative pt-36 pb-16 px-6 text-center z-10">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 backdrop-blur-xl">
          <Cookie className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-cyan-300">Cookie Policy</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
          Cookie{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Policy
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          This policy explains what cookies we use, why we use them, and how you can control them.
        </p>
        <p className="text-xs text-slate-500 mt-4">Last updated: {lastUpdated} · BootHop Ltd, United Kingdom</p>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">

        <Section id="what-are-cookies" title="What Are Cookies?" icon={Cookie}>
          <p>Cookies are small text files placed on your device when you visit a website. They allow the site to remember information about your visit — such as your login state or preferences — making your next visit easier and the site more useful to you.</p>
          <p>Cookies cannot carry viruses or install malware on your device. They do not contain personally identifiable information on their own, but may link to such information we hold about you.</p>
        </Section>

        <Section id="how-we-use" title="How We Use Cookies" icon={Settings}>
          <p>BootHop uses cookies strictly for the operation of the platform and to improve your experience. We <strong className="text-white">do not</strong> use advertising cookies, tracking pixels, or sell cookie data to third parties.</p>
          <p>We use cookies for the following purposes:</p>
          <ul className="space-y-3 pl-2">
            {[
              ['Essential / Session', 'Required for the platform to function. These maintain your authentication session so you stay logged in as you navigate between pages.'],
              ['Security', 'Help protect you against cross-site request forgery (CSRF) and other security threats.'],
              ['Preference', 'Remember your in-app settings and preferences (e.g. language, display options).'],
              ['Analytics', 'Anonymous, aggregated data to help us understand how visitors use the platform so we can improve it. No personal data is shared with analytics providers.'],
            ].map(([type, desc]) => (
              <li key={type as string} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span><strong className="text-white">{type}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="cookies-we-set" title="Cookies We Set" icon={BarChart2}>
          <p>The following cookies may be set when you use BootHop:</p>
          <div className="rounded-xl border border-white/10 overflow-hidden text-xs mt-2">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-300">Cookie Name</th>
                  <th className="text-left p-3 font-semibold text-slate-300">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-300">Purpose</th>
                  <th className="text-left p-3 font-semibold text-slate-300">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <Row name="sb-access-token" type="Essential" purpose="Supabase authentication session token — keeps you logged in" expiry="1 hour" />
                <Row name="sb-refresh-token" type="Essential" purpose="Refreshes your authentication session without re-login" expiry="7 days" />
                <Row name="__stripe_mid" type="Essential" purpose="Stripe fraud prevention and payment processing" expiry="1 year" />
                <Row name="__stripe_sid" type="Essential" purpose="Stripe session identifier for payment security" expiry="30 minutes" />
                <Row name="boothop_prefs" type="Preference" purpose="Stores your display preferences (e.g. theme, filter settings)" expiry="30 days" />
                <Row name="_bh_anon" type="Analytics" purpose="Anonymous visitor ID for aggregated usage analytics (no PII)" expiry="90 days" />
              </tbody>
            </table>
          </div>
          <p className="mt-3">Third-party cookies may also be set by Stripe when you make a payment. These are governed by <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">Stripe's Cookie Policy</a>.</p>
        </Section>

        <Section id="third-party" title="Third-Party Cookies" icon={Shield}>
          <p>We use the following third-party services which may set their own cookies:</p>
          <ul className="space-y-3 pl-2">
            {[
              ['Stripe', 'Payment processing. Stripe sets cookies for fraud prevention and session management during checkout. See stripe.com/privacy for details.'],
              ['Supabase', 'Authentication and database infrastructure. Session cookies are set to maintain your logged-in state.'],
            ].map(([name, desc]) => (
              <li key={name as string} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span><strong className="text-white">{name}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <p>We do not use Google Analytics, Facebook Pixel, or any advertising network cookies.</p>
        </Section>

        <Section id="control" title="How to Control Cookies" icon={Trash2}>
          <p>You can control and manage cookies in several ways:</p>
          <ul className="space-y-3 pl-2">
            {[
              'Browser settings: Most browsers allow you to block or delete cookies. See your browser\'s help documentation for instructions.',
              'Opt-out of analytics: You can opt out of anonymous analytics tracking by contacting us at privacy@boothop.com.',
              'Essential cookies cannot be disabled without breaking core platform functionality such as login and payment.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>Blocking essential cookies will prevent you from logging in or completing payments on BootHop. We recommend allowing essential cookies for full platform functionality.</p>
        </Section>

        <Section id="changes" title="Changes to This Policy" icon={Settings}>
          <p>We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our use of cookies. The "Last updated" date at the top of this page will always show when it was last revised.</p>
          <p>Continued use of BootHop after any changes constitutes your acceptance of the updated policy.</p>
        </Section>

        <Section id="contact" title="Contact Us" icon={Mail}>
          <p>If you have any questions about our use of cookies, please contact us at:</p>
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 space-y-1">
            <p className="font-semibold text-white">BootHop Ltd — Privacy &amp; Cookies</p>
            <p>Email: <a href="mailto:privacy@boothop.com" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">privacy@boothop.com</a></p>
            <p>Registered in England and Wales</p>
          </div>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
