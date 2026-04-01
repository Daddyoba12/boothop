import Link from 'next/link';
import { Package, Users, Globe, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';

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

{/* Three Videos Side by Side */}
<div className="grid grid-cols-3 gap-4 h-[500px]">
  
  {/* Left Video */}
  <div className="relative rounded-xl overflow-hidden shadow-lg bg-black">
    <video
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    >
      <source src="/videos/Aboutus_train.mp4" type="video/mp4" />

      
     
      Your browser does not support the video tag.
    </video>
  </div>

  {/* Center Video (Main) */}
  <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
  <video
    autoPlay
    muted
    loop
    playsInline
    className="w-full h-full object-contain"
    style={{ objectPosition: 'center center' }}
  >
    <source src="/videos/about-us.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
  
  {/* Badge overlay */}
  <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg">
    <div className="flex items-center gap-2">
      <Package className="h-5 w-5 text-blue-600" />
      <span className="font-semibold text-gray-900">About BootHop</span>
    </div>
  </div>
</div>


  {/* Right Video */}
  <div className="relative rounded-xl overflow-hidden shadow-lg bg-black">
    <video
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    >
      <source src="/videos/Aboutus_train.mp4" type="video/mp4" />
      
      Your browser does not support the video tag.
    </video>
  </div>

</div>



      {/* Our Story Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Icon Feature */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
                <Package className="h-20 w-20 mb-6 opacity-90" />
                <h3 className="text-3xl font-bold mb-4">Redundant Boot Space</h3>
                <p className="text-lg text-blue-100">
                  Every journey has the potential to move items. Why travel with empty space?
                </p>
              </div>
            </div>

            {/* Right - Story Content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  We started with a simple idea: <strong>use redundant boot space to transport goods</strong> to their destination. Every journey has the potential to move items.
                </p>
                <p className="text-2xl font-semibold text-blue-600">
                  Why drive an empty car? Why drive with an empty boot?
                </p>
                <p>
                  Documents are even more convenient to transport. They easily fit into hand luggage, and you'd be helping someone else out.
                </p>
                <p className="font-semibold text-gray-900">
                  We're helping to connect the world, one journey at a time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-8">
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              We love little things, small and medium-sized packages—actually anything that can be carried on an existing journey. We specialize in{' '}
              <span className="font-bold text-blue-600">personal effects, letters, and small parcels</span>.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Courier services are great, but they're not one-size-fits-all. We are an alternative service that's flexible and convenient.
            </p>
            
            <div className="bg-blue-600 text-white rounded-xl p-8">
              <p className="text-3xl font-bold mb-2">
                You are already going to make that journey
              </p>
              <p className="text-2xl">—why not make it count?</p>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Personal Effects</h3>
              <p className="text-gray-600 text-sm">Small personal items delivered with care</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Letters & Documents</h3>
              <p className="text-gray-600 text-sm">Important papers delivered securely</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Small Parcels</h3>
              <p className="text-gray-600 text-sm">Compact packages sent worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do at BootHop</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community First</h3>
              <p className="text-gray-600 leading-relaxed">
                We believe in the power of people helping people. Our platform connects communities and creates meaningful interactions between travelers and senders.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Efficiency</h3>
              <p className="text-gray-600 leading-relaxed">
                We maximize the potential of every journey by utilizing existing transportation capacity, reducing waste and environmental impact.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trust & Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                Safety and trust are at the core of our platform. We provide secure transactions and verified user profiles to ensure peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">BootHop by the Numbers</h2>
            <p className="text-xl text-blue-100">Making a real impact on communities worldwide</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-6xl font-bold mb-2">10K+</div>
              <div className="text-xl text-blue-100">Happy Users</div>
            </div>
            <div>
              <div className="text-6xl font-bold mb-2">50K+</div>
              <div className="text-xl text-blue-100">Successful Deliveries</div>
            </div>
            <div>
              <div className="text-6xl font-bold mb-2">200+</div>
              <div className="text-xl text-blue-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-6xl font-bold mb-2">95%</div>
              <div className="text-xl text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of travelers and senders already using BootHop
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center"
            >
              Sign Up Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/how-it-works"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Learn More
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
