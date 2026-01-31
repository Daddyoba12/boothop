import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package, Users, Globe, Shield, Star, Plane } from 'lucide-react';

export default function HomePage() {
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
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About Us
              </Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">
                How It Works
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/customs" className="text-gray-600 hover:text-gray-900">
                Customs Info
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Plane className="h-12 w-12 text-blue-600 animate-bounce" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect the World,<br />
            <span className="text-blue-600">One Journey at a Time</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            BootHop is the peer-to-peer logistics platform that connects verified travelers with 
            people who need personal effects, letters, and small parcels delivered. Safe, secure, and seamless.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=booter"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/journeys"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Browse Deliveries
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600 mt-2">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">50K+</div>
              <div className="text-gray-600 mt-2">Successful Deliveries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">200+</div>
              <div className="text-gray-600 mt-2">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">95%</div>
              <div className="text-gray-600 mt-2">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, secure, and efficient delivery solution</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">1. Choose Your Role</h3>
                  <p className="text-gray-600">
                    Become a <strong>Booter</strong> (traveler) to earn money on your trips, or a <strong>Hooper</strong> to send items worldwide.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Globe className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">2. Post or Browse</h3>
                  <p className="text-gray-600">
                    Booters post their travel plans, Hoopers browse available journeys or post delivery requests.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">3. Verify Identity</h3>
                  <p className="text-gray-600">
                    Our platform provides secure identity verification for international deliveries.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">4. Complete & Rate</h3>
                  <p className="text-gray-600">
                    Safe delivery, secure payment, and community feedback to build trust.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/travelers-group.jpg"
                alt="Connect & Travel Together"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Connect & Travel Together</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Connecting Cities Worldwide</h2>
            <p className="text-xl text-gray-600">From bustling metropolises to charming destinations</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Lagos', image: '/images/lagos.jpg' },
              { name: 'London', image: '/images/london.jpg' },
              { name: 'New York', image: '/images/newyork.jpg' },
              { name: 'Tokyo', image: '/images/tokyo.jpg' },
            ].map((city) => (
              <div key={city.name} className="relative h-64 rounded-xl overflow-hidden group cursor-pointer">
                <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white text-2xl font-bold">
                  {city.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose BootHop */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose BootHop?</h2>
            <p className="text-xl text-gray-600">Built for trust, designed for convenience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-2xl">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Identity Verification</h3>
              <p className="text-gray-600">
                Advanced identity verification ensures peace of mind for all deliveries.
              </p>
            </div>

            <div className="bg-green-50 p-8 rounded-2xl">
              <Globe className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Global Network</h3>
              <p className="text-gray-600">
                Connect with travelers and senders worldwide. From local deliveries to international shipping.
              </p>
            </div>

            <div className="bg-orange-50 p-8 rounded-2xl">
              <Star className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Trust & Ratings</h3>
              <p className="text-gray-600">
                Community-driven rating system and secure escrow payments build trust in every transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8">
            Join thousands of travelers and senders already using BootHop
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Sign Up Now
            </Link>
            <Link 
              href="/about"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition border-2 border-white"
            >
              Explore Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold text-white">BootHop</span>
              </div>
              <p className="text-sm">
                Connecting the world, one journey at a time.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing & Fees</Link></li>
                <li><Link href="/trust-safety" className="hover:text-white">Trust & Safety</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/customs" className="hover:text-white">Customs & Regulations</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 BootHop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
