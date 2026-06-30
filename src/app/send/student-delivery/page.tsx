import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Home, Package, Clock, Shirt, BookOpen } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { TikTokViewContent } from '@/components/TikTokTracker';

export const metadata: Metadata = {
  title: 'Student Delivery UK – Send Stuff to University or Back Home | BootHop',
  description: "Forgot your winter coat? Need your PS5 at uni? BootHop connects students with verified travellers already heading the same way — same-day UK delivery, no courier van needed. From £15.",
  keywords: [
    'student delivery UK', 'send stuff to university UK', 'student package delivery',
    'send belongings to uni', 'student luggage delivery UK', 'goods left at home delivery',
    'forgotten items university', 'student parcel delivery UK', 'send items to student UK',
    'university delivery service UK', 'student moving delivery', 'send package to student UK',
    'student courier UK', 'deliver to university halls', 'send forgotten items to uni',
  ],
  openGraph: {
    title: 'Student Delivery UK – Send Stuff to University or Back Home | BootHop',
    description: 'Forgot something at home? Someone is already driving to your uni town today. BootHop gets it there.',
    type: 'website',
    url: 'https://www.boothop.com/send/student-delivery',
  },
  alternates: { canonical: 'https://www.boothop.com/send/student-delivery' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Student Package Delivery UK',
  provider: { '@type': 'Organization', name: 'BootHop', url: 'https://www.boothop.com' },
  serviceType: 'Same-Day Delivery Service',
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  description: 'BootHop helps students and families send belongings, forgotten items, and care packages to and from university — using verified travellers already making the journey.',
  url: 'https://www.boothop.com/send/student-delivery',
};

const scenarios = [
  { icon: Shirt, title: "Winter coat still at home", desc: "Freshers week ends. Winter starts. Someone from your hometown is heading to your uni city this weekend." },
  { icon: Package, title: "Care packages from parents", desc: "Mum made jollof rice. Dad bought the wrong size trainers again. Either way, it gets there today." },
  { icon: BookOpen, title: "Left your textbooks at home", desc: "Assignment due Friday, books still in your bedroom shelf. Traveller collects, delivers, done." },
  { icon: GraduationCap, title: "End-of-term move-out", desc: "Can't take everything home on the train. A verified traveller with a car is heading your way." },
  { icon: Home, title: "Sending things back", desc: "Heading home for summer but your room is full. Send the heavy stuff ahead — no extra luggage fees." },
  { icon: Clock, title: "Forgotten medication", desc: "When it's urgent, it's urgent. Same-day delivery means it arrives today, not in two to three working days." },
];

const routes = [
  'London → Manchester', 'London → Birmingham', 'London → Leeds',
  'London → Sheffield', 'Birmingham → Nottingham', 'Manchester → Liverpool',
  'London → Bristol', 'London → Newcastle', 'Edinburgh → St Andrews',
  'London → Cardiff', 'Oxford → London', 'Cambridge → London',
];

export default function StudentDeliveryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TikTokViewContent contentName="Student Delivery" contentType="delivery_service" />
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <GraduationCap className="h-3.5 w-3.5" /> STUDENT DELIVERY
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Send Your Stuff<br />
          <span className="text-blue-400">To Uni or Back Home</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          Someone is already travelling between your home city and your university today. BootHop connects your package with a verified traveller heading in the same direction — same-day, no depot, no drama.
        </p>
        <p className="text-slate-400 mb-10 text-sm">
          Used by students across every UK university city. From £15 per delivery.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]"
          >
            Send Something Today <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/journeys" className="text-slate-400 hover:text-white text-sm underline underline-offset-4">
            See live UK journeys →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {[
            { stat: 'Same Day', label: 'UK delivery' },
            { stat: 'From £15', label: 'Student routes' },
            { stat: 'ID Verified', label: 'Every carrier' },
            { stat: '£20 credit', label: 'First delivery free' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-blue-400">{stat}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">When Students Need BootHop</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          University life creates a thousand moments where something needs to travel. Here are the ones we hear most.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
              <Icon className="h-6 w-6 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-4">How It Works</h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">Under 5 minutes to post. No account needed to browse routes.</p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Post your delivery', desc: 'Tell us what needs to move, from where to where, and when.' },
            { step: '02', title: 'Match with a traveller', desc: 'We find someone already heading your route — often the same day.' },
            { step: '03', title: 'Arrange handoff', desc: 'Meet at a convenient spot (Starbucks, train station, halls reception).' },
            { step: '04', title: 'Delivered & confirmed', desc: 'Recipient confirms delivery. Payment releases. Done.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="text-blue-400 font-black text-sm mb-3">{step}</div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Routes */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-4">Popular Student Routes</h2>
        <p className="text-slate-400 text-center mb-10">Travellers post these corridors every day.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {routes.map(route => (
            <div key={route} className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-200 hover:border-blue-500/40 transition-colors">
              {route}
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          Your route not listed?{' '}
          <Link href="/journeys" className="text-blue-400 hover:underline">Check live journeys</Link> — new ones are added every hour.
        </p>
      </section>

      {/* Parent callout */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="bg-white/4 border border-white/8 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-3">Parents: send a care package today</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Home-cooked food, forgotten medication, a new laptop charger. You don't need to wait for a visit. BootHop gets it there today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-full text-sm transition-all"
          >
            Send a Care Package <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto bg-blue-500/10 border border-blue-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-4">Stop waiting. Start sending.</h2>
          <p className="text-slate-400 mb-8">
            Your first £20 of deliveries is on us. Post your route and get matched with a verified traveller in minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5"
          >
            Claim Your £20 Credit <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-6">No subscription · Pay per delivery · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
