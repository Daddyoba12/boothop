import Link from 'next/link';
import Image from 'next/image';
import { Package, Users, Globe, Shield, Star, CheckCircle } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">BootHop</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">How BootHop Works</h1>
          <p className="text-xl text-gray-600">
            Connect travelers with senders for secure, community-powered deliveries
          </p>
        </div>
      </section>

      {/* For Booters */}
     <section className="py-24 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    
    {/* CONTENT */}
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <span className="text-blue-600 text-xl">✈️</span>
        </div>
        <h2 className="text-3xl font-bold">
          For Booters (Travelers)
        </h2>
      </div>

      <p className="text-gray-600 mb-10">
        Earn money while you travel
      </p>

      <div className="space-y-6">
        {[
          ['Post Your Journey', 'Share your route, dates, and available luggage space.'],
          ['Browse Requests', 'See delivery requests along your route.'],
          ['Agree on Terms', 'Confirm price and customs compliance.'],
          ['Collect & Deliver', 'Carry the item and deliver it safely.'],
          ['Get Paid', 'Payment is released once delivery is confirmed.'],
        ].map(([title, desc], i) => (
          <div key={i} className="flex gap-4">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* IMAGE */}
    <div className="relative w-full h-[1000px] rounded-2xl overflow-hidden shadow-lg">
      <Image
        src="/images/how-it-works-booter2.jpg"
               alt="How BootHop works for travelers"
        fill
        className="object-cover"
      />
    </div>

  </div>
</section>


      {/* For Hoopers */}
    <section className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    
    {/* IMAGE */}
    <div className="relative w-full h-[1000px] rounded-2xl overflow-hidden shadow-lg">
      <Image
        src="/images/how-it-works-hooper.jpg"
                alt="How BootHop works for senders"
        fill
        className="object-cover"
        priority
      />
    </div>

    {/* CONTENT */}
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-4 rounded-full">
          <span className="text-green-600 text-xl">📦</span>
        </div>
        <h2 className="text-3xl font-bold">
          For Hoopers (Senders)
        </h2>
      </div>

      <p className="text-gray-600 mb-10">
        Send items worldwide affordably
      </p>

      <div className="space-y-6">
        {[
          ['Post Your Request', 'Describe your item, pickup/delivery locations, and offer a price.'],
          ['Find a Traveler', 'Browse verified travelers going your way or wait for acceptance.'],
          ['Pay Securely', 'Payment is held in escrow (price + 3% service fee).'],
          ['Track Delivery', 'Stay in touch with your Booter through messaging.'],
          ['Confirm Receipt', 'Confirm delivery to release payment.'],
        ].map(([title, desc], i) => (
          <div key={i} className="flex gap-4">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>


      {/* Safety Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Safety & Security</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-full inline-block mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Identity Verification</h3>
              <p className="text-gray-600 text-sm">
                All users verified for international deliveries
              </p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Escrow Payments</h3>
              <p className="text-gray-600 text-sm">
                Money held securely until both parties confirm
              </p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-orange-100 rounded-full inline-block mb-4">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Rating System</h3>
              <p className="text-gray-600 text-sm">
                Community-driven trust through reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8">
            Join thousands already using BootHop
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=booter"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Become a Booter
            </Link>
            <Link 
              href="/register?type=hooper"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition border-2 border-white"
            >
              Become a Hooper
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
