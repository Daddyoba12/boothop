import Link from 'next/link';
import Image from 'next/image';
import { Package, Users, Globe, Shield, Star, ArrowRight } from 'lucide-react';

export default function AboutPage() {
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
              <Link href="/about" className="text-blue-600 font-semibold">
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About Us</h1>
          <p className="text-2xl text-gray-600 mb-4">
            BootHop is a people-powered transportation network.
          </p>
          <p className="text-xl text-gray-600">
            We optimize the value of any journey by connecting people to help goods get to their destination.
          </p>
        </div>
      </section>

      {/* Redundant Boot Space */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Redundant Boot Space</h2>
              </div>
              
              <div className="space-y-4 text-gray-600 text-lg">
                <p>
                  We started with the idea to use redundant boot space to transport goods to their destination. 
                  The idea was simple: every journey has the potential to move items.
                </p>
                <p className="font-semibold text-gray-900">
                  Why drive an empty car? Why drive with an empty boot? Make every journey count.
                </p>
                <p>
                  Documents are even more convenient to transport. They easily fit into hand luggage, and you'd be 
                  helping someone else out. We're helping to connect the world.
                </p>
              </div>

              <Link 
                href="/register"
                className="inline-flex items-center mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Maximize Every Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/city-traffic.jpg"
                alt="City Traffic"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Mission</h2>
          
          <div className="space-y-6 text-lg text-gray-600">
            <p>
              We love little things, small and medium-sized packages—actually anything that can be carried 
              on an existing journey. We specialize in <strong>personal effects, letters, and small parcels</strong>.
            </p>
            <p>
              Courier services are great, but they're not one-size-fits-all. We are an alternative service 
              that's flexible and convenient.
            </p>
            <p className="text-2xl font-semibold text-blue-600 text-center py-6">
              You are already going to make that journey—why not make it count?
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do at BootHop</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community First</h3>
              <p className="text-gray-600">
                We believe in the power of people helping people. Our platform connects communities and creates 
                meaningful interactions between travelers and senders.
              </p>
            </div>

            <div className="bg-green-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Efficiency</h3>
              <p className="text-gray-600">
                We maximize the potential of every journey by utilizing existing transportation capacity, 
                reducing waste and environmental impact.
              </p>
            </div>

            <div className="bg-purple-50 p-8 rounded-2xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trust & Safety</h3>
              <p className="text-gray-600">
                Safety and trust are at the core of our platform. We provide secure transactions and verified 
                user profiles to ensure peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By The Numbers */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">BootHop by the Numbers</h2>
            <p className="text-xl text-gray-600">Making a real impact on communities worldwide</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600 text-lg">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600 text-lg">Successful Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">200+</div>
              <div className="text-gray-600 text-lg">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600 text-lg">Satisfaction Rate</div>
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
              href="/journeys"
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
