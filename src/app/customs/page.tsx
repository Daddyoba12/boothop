import Link from 'next/link';
import { Package, AlertTriangle, ExternalLink, Shield, FileText, Globe } from 'lucide-react';

export default function CustomsPage() {
  const countries = [
    { code: 'GB', name: 'United Kingdom', url: 'https://www.gov.uk/government/organisations/hm-revenue-customs' },
    { code: 'US', name: 'United States', url: 'https://www.cbp.gov/' },
    { code: 'EU', name: 'European Union', url: 'https://ec.europa.eu/taxation_customs/index_en' },
    { code: 'CA', name: 'Canada', url: 'https://www.cbsa-asfc.gc.ca/' },
    { code: 'AU', name: 'Australia', url: 'https://www.abf.gov.au/' },
    { code: 'NZ', name: 'New Zealand', url: 'https://www.customs.govt.nz/' },
    { code: 'JP', name: 'Japan', url: 'https://www.customs.go.jp/english/' },
    { code: 'SG', name: 'Singapore', url: 'https://www.customs.gov.sg/' },
    { code: 'AE', name: 'UAE', url: 'https://www.fca.gov.ae/' },
    { code: 'ZA', name: 'South Africa', url: 'https://www.sars.gov.za/' },
    { code: 'NG', name: 'Nigeria', url: 'https://customs.gov.ng/' },
    { code: 'IN', name: 'India', url: 'https://www.cbic.gov.in/' },
  ];

  const prohibitedItems = [
    'Illegal drugs or controlled substances',
    'Weapons, firearms, ammunition, or explosives',
    'Counterfeit goods or pirated materials',
    'Hazardous or flammable materials',
    'Live animals or plants (without permits)',
    'Human remains',
    'Stolen property or items',
    'Items violating intellectual property rights',
    'Pornographic or obscene materials (where illegal)',
    'Tobacco products (without proper documentation)',
  ];

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
              <Link href="/customs" className="text-blue-600 font-semibold">
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
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Customs & Regulations</h1>
          <p className="text-xl text-gray-600">
            Important information about international shipping responsibilities
          </p>
        </div>
      </section>

      {/* Warning Banner */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">Critical Information</h3>
                <p className="text-red-800">
                  <strong>BootHop is a platform for sending personal effects, letters, and small parcels only.</strong> 
                  We are NOT responsible or obligated for items transported. Both Booters and Hoopers are independently 
                  responsible for understanding and complying with all customs regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Responsibility */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Responsibility</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Both Parties Must:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Verify that items are legal to export from the departure country</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Verify that items are legal to import into the destination country</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Declare all items accurately and honestly</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Pay any applicable duties, taxes, or fees</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Obtain necessary permits or licenses (if required)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Provide proper documentation (invoices, receipts, etc.)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-gray-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Before Posting or Accepting:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>Check departure country export regulations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Check destination country import regulations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Understand potential duty and tax obligations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>Ensure proper packaging and labeling</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">5.</span>
                      <span>Keep copies of all documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prohibited Items */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Strictly Prohibited Items</h2>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
            <p className="font-bold text-red-900 mb-6 text-lg">
              BootHop STRICTLY PROHIBITS the transport of the following items:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {prohibitedItems.map((item, index) => (
                <div key={index} className="flex items-start bg-white p-4 rounded-lg border border-red-200">
                  <span className="text-red-600 font-bold mr-3">❌</span>
                  <span className="text-gray-900">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-red-300">
              <p className="text-red-900 font-semibold">
                ⚠️ Violation of these prohibitions may result in immediate account suspension, 
                legal action, and notification to relevant authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customs Resources */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customs Authority Resources</h2>
            <p className="text-gray-600">
              Links to official customs websites by country
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => (
              <a
                key={country.code}
                href={country.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200 transition">
                    <span className="text-lg font-bold text-blue-600">{country.code}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{country.name}</span>
                </div>
                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition" />
              </a>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Don't see your country listed?</p>
            <Link 
              href="/contact"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              Contact us to add more countries
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery Type Guidance */}
      <section className="py-12 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">When Do Customs Regulations Apply?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
              <h3 className="font-bold text-xl text-gray-900 mb-4">✅ International Deliveries</h3>
              <p className="text-gray-700 mb-4">
                <strong>Full customs compliance required</strong> when crossing international borders.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Declaration forms required</li>
                <li>• Duties and taxes may apply</li>
                <li>• Items may be inspected</li>
                <li>• Proper documentation essential</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-green-200">
              <h3 className="font-bold text-xl text-gray-900 mb-4">✅ Domestic Deliveries</h3>
              <p className="text-gray-700 mb-4">
                <strong>Simplified process</strong> for deliveries within the same country.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• No customs declarations</li>
                <li>• No import duties</li>
                <li>• Faster process</li>
                <li>• Still subject to local laws</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
              <h3 className="font-bold text-xl text-gray-900 mb-4">✅ Within EU/Schengen</h3>
              <p className="text-gray-700 mb-4">
                <strong>Reduced requirements</strong> for travel within the European Union.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Generally no customs checks</li>
                <li>• Free movement of goods</li>
                <li>• Some restrictions still apply</li>
                <li>• Check specific regulations</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
              <h3 className="font-bold text-xl text-gray-900 mb-4">⚠️ Special Cases</h3>
              <p className="text-gray-700 mb-4">
                <strong>Extra caution needed</strong> for certain items or routes.
              </p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• High-value items (over $800)</li>
                <li>• Electronics and batteries</li>
                <li>• Food and agricultural products</li>
                <li>• Medications and supplements</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Liability Statement */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Liability & Disclaimer</h2>
          
          <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg space-y-4 text-gray-700">
            <p className="font-semibold text-gray-900">
              BootHop is a platform that connects travelers (Booters) with senders (Hoopers).
            </p>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-2">YOU are responsible for:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Complying with all applicable laws and regulations</li>
                <li>• Declaring items accurately and honestly</li>
                <li>• Paying any duties, taxes, or fees that may be owed</li>
                <li>• Ensuring items are legal in both departure and destination countries</li>
                <li>• Obtaining necessary permits, licenses, or approvals</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">BootHop is NOT responsible for:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Customs seizures or confiscations</li>
                <li>• Legal violations by users</li>
                <li>• Duties, taxes, or fees owed</li>
                <li>• Delays caused by customs inspections</li>
                <li>• Items prohibited by law in any jurisdiction</li>
                <li>• Penalties or fines incurred by users</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mt-4">
              <p className="text-yellow-900 font-semibold">
                ⚠️ By using BootHop, you acknowledge that you are solely responsible for customs compliance 
                and that BootHop provides only a platform to connect users. We strongly advise consulting 
                with customs authorities or legal professionals if you have any doubts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Understand Your Responsibilities?</h2>
          <p className="text-xl mb-8">
            Start using BootHop for personal effects, letters, and small parcels
          </p>
          <Link 
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            Get Started
          </Link>
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

