import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, CheckCircle, Star } from 'lucide-react';

export default function HowItWorksPage() {
  const booterSteps = [
    { num: '01', title: 'Post Your Journey', desc: 'Share your route, travel dates, and available luggage capacity. Takes under 60 seconds.' },
    { num: '02', title: 'Browse Requests', desc: 'See curated delivery requests along your exact route from verified senders.' },
    { num: '03', title: 'Agree on Terms', desc: 'Confirm price and customs compliance through our secure in-app messaging.' },
    { num: '04', title: 'Collect & Deliver', desc: 'Meet the sender, carry the item, and deliver it safely at your destination.' },
    { num: '05', title: 'Get Paid Instantly', desc: 'Payment is released the moment delivery is confirmed by both parties.' },
  ];

  const hooperSteps = [
    { num: '01', title: 'Post Your Request', desc: 'Describe your item, pickup and delivery locations, and set your budget.' },
    { num: '02', title: 'Find a Traveller', desc: 'Browse verified travellers heading your way or get matched automatically.' },
    { num: '03', title: 'Pay Securely', desc: 'Funds go into escrow — your money is protected until delivery is confirmed.' },
    { num: '04', title: 'Track Delivery', desc: 'Stay in touch with your Booter through real-time in-app messaging.' },
    { num: '05', title: 'Confirm Receipt', desc: 'Confirm safe delivery to release payment. Rate your experience.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/boothop.png" alt="BootHop" width={160} height={44} className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">How It Works</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
          Delivery,<br />
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">reimagined.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          A global community of verified travellers and trusted senders, connected through escrow-protected deliveries.
        </p>
      </section>

      {/* ── BOOTER SECTION ── */}
      <section className="overflow-hidden">
        <div className="relative h-[520px] md:h-[600px] w-full">
          <Image
            src="/images/Delivery.jpg"
            alt="Booter — earn while you travel"
            fill
            className="object-cover object-left"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-sm">
                  <span className="text-xs font-bold tracking-widest uppercase text-cyan-300">For Booters ✈️</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                  Your journey.<br />
                  <span className="text-cyan-400">Your income.</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Already travelling? Turn your spare luggage capacity into real earnings on every trip.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-16 right-6 md:right-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-right">
            <div className="text-xs font-bold tracking-widest text-white/50 mb-1">AVG. EARNINGS PER TRIP</div>
            <div className="text-3xl font-black text-white">£85 — £320</div>
          </div>
        </div>

        <div className="bg-white px-6 py-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-10">How Booters get started</h3>
              <div className="space-y-0">
                {booterSteps.map((step, i) => (
                  <div key={i} className={`flex gap-5 pb-8 relative ${i < booterSteps.length - 1 ? 'before:absolute before:left-5 before:top-11 before:w-px before:h-[calc(100%-20px)] before:bg-gradient-to-b before:from-blue-200 before:to-transparent' : ''}`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-blue-600">{step.num}</span>
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="text-3xl font-black text-blue-600 mb-1">£320</div>
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Max per trip</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl font-black text-slate-900 mb-1">10K+</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Verified users</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl font-black text-slate-900 mb-1">95%</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Satisfaction</div>
                </div>
                <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100">
                  <div className="text-3xl font-black text-cyan-600 mb-1">Free</div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">To join</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {['Identity Verified', 'Escrow Protected', 'Instant Pay', 'Free to Join'].map((t) => (
                  <div key={t} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">{t}</span>
                  </div>
                ))}
              </div>

              <Link href="/register?type=booter"
                className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-5 rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all active:scale-[0.98] group">
                <span>Start as a Booter</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* ── HOOPER SECTION ── */}
      <section className="overflow-hidden">
        <div className="relative h-[520px] md:h-[600px] w-full">
          <Image
            src="/images/GoingonHols.jpg"
            alt="Hooper — send packages globally"
            fill
            className="object-cover object-center"
          />
          {/* Dark overlay on LEFT — people are on right, car/dark area on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

          {/* Text on LEFT over dark car area */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-sm">
                  <span className="text-xs font-bold tracking-widest uppercase text-emerald-300">For Hoopers 📦</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                  Send it.<br />
                  <span className="text-emerald-400">They&apos;ll carry it.</span>
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Send packages internationally at a fraction of courier costs. Every penny protected by escrow.
                </p>
              </div>
            </div>
          </div>

          {/* Badge bottom left */}
          <div className="absolute bottom-16 left-6 md:left-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
            <div className="text-xs font-bold tracking-widest text-white/50 mb-1">SAVE VS COURIERS</div>
            <div className="text-3xl font-black text-white">Up to <span className="text-emerald-400">70%</span> less</div>
          </div>
        </div>

        <div className="bg-white px-6 py-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="text-3xl font-black text-emerald-600 mb-1">70%</div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Cheaper</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl font-black text-slate-900 mb-1">50K+</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Deliveries done</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl font-black text-slate-900 mb-1">200+</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cities</div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="text-3xl font-black text-emerald-600 mb-1">Free</div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">To post</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {['Escrow Protected', 'Verified Travellers', 'Real-time Tracking', 'Free to Post'].map((t) => (
                  <div key={t} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">{t}</span>
                  </div>
                ))}
              </div>

              <Link href="/register?type=hooper"
                className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-5 rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all active:scale-[0.98] group">
                <span>Send Your First Item</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-10">How Hoopers get started</h3>
              <div className="space-y-0">
                {hooperSteps.map((step, i) => (
                  <div key={i} className={`flex gap-5 pb-8 relative ${i < hooperSteps.length - 1 ? 'before:absolute before:left-5 before:top-11 before:w-px before:h-[calc(100%-20px)] before:bg-gradient-to-b before:from-emerald-200 before:to-transparent' : ''}`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-emerald-600">{step.num}</span>
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFETY ── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-600">Built to protect you</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              Safety &amp; <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Security</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100', title: 'Identity Verification', desc: 'Every user undergoes rigorous verification before their first transaction. Government ID, address check, ongoing review.', stat: '100%', statLabel: 'Verified users', statColor: 'text-blue-600' },
              { icon: <CheckCircle className="h-6 w-6 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', title: 'Escrow Payments', desc: 'Funds are held securely from the moment of agreement. Released only when both parties confirm successful delivery.', stat: '£0', statLabel: 'Lost to fraud', statColor: 'text-emerald-600' },
              { icon: <Star className="h-6 w-6 text-amber-600" />, bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', title: 'Community Rating', desc: 'Every delivery is rated by both parties. Our reputation system surfaces the best travellers and most reliable senders.', stat: '95%', statLabel: 'Satisfaction rate', statColor: 'text-amber-600' },
            ].map((card, i) => (
              <div key={i} className={`rounded-3xl border ${card.bg} p-8`}>
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center mb-6`}>{card.icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-3">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">{card.desc}</p>
                <div className="border-t border-slate-200/60 pt-6">
                  <div className={`text-4xl font-black ${card.statColor} mb-1`}>{card.stat}</div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{card.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
            Your journey starts<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">right now.</span>
          </h2>
          <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of verified travellers and senders already part of the BootHop community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?type=booter" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all active:scale-[0.98]">
              I&apos;m a Traveller <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?type=hooper" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all active:scale-[0.98]">
              I need to Send <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-6 tracking-widest uppercase">Free to join · No subscription · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white text-sm">B</div>
            <span className="font-bold text-slate-900">Boot<span className="text-blue-500">Hop</span></span>
          </Link>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} BootHop. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}