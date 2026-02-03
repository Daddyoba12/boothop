import Link from 'next/link';
import { Package, DollarSign, Shield, Check, AlertCircle } from 'lucide-react';

export default function PricingPage() {
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
              <Link href="/pricing" className="text-blue-600 font-semibold">
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
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Pricing & Fees</h1>
          <p className="text-xl text-gray-600">
            Transparent, fair pricing for everyone. No hidden fees.
          </p>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Pricing Works</h2>
            <p className="text-gray-600">Simple, transparent fees for both parties</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hooper Pricing */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                For Hoopers (Senders)
              </h3>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-blue-600 mb-2">+3%</div>
                  <div className="text-gray-600">Service Fee</div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-gray-700 mb-4">When you agree on a delivery price with a Booter:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agreed Price:</span>
                      <span className="font-semibold">£100.00</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>+ Service Fee (3%):</span>
                      <span className="font-semibold">£3.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>You Pay:</span>
                      <span className="text-blue-600">£103.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Pay only when a Booter accepts</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Funds held securely in escrow</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Released only after confirmation</span>
                </li>
              </ul>
            </div>

            {/* Booter Pricing */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-green-100 rounded-full">
                  <DollarSign className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                For Booters (Travelers)
              </h3>
              
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">-5%</div>
                  <div className="text-gray-600">Service Fee</div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-gray-700 mb-4">When you complete a delivery:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agreed Price:</span>
                      <span className="font-semibold">£100.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>- Service Fee (5%):</span>
                      <span className="font-semibold">£5.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>You Receive:</span>
                      <span className="text-green-600">£95.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Earn money on your travels</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Fee covers identity verification</span>
                </li>
                <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Payment after both confirmations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Breakdown */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Fee Breakdown
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-4 px-4">Agreed Price</th>
                    <th className="text-right py-4 px-4">Hooper Pays<br/><span className="text-sm font-normal text-gray-500">(+3%)</span></th>
                    <th className="text-right py-4 px-4">Booter Receives<br/><span className="text-sm font-normal text-gray-500">(-5%)</span></th>
                    <th className="text-right py-4 px-4">Platform Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { agreed: 50, hooper: 51.50, booter: 47.50, platform: 4 },
                    { agreed: 100, hooper: 103, booter: 95, platform: 8 },
                    { agreed: 200, hooper: 206, booter: 190, platform: 16 },
                    { agreed: 500, hooper: 515, booter: 475, platform: 40 },
                  ].map((row) => (
                    <tr key={row.agreed} className="hover:bg-gray-50">
                      <td className="py-4 px-4 font-semibold">£{row.agreed}</td>
                      <td className="py-4 px-4 text-right text-blue-600 font-semibold">£{row.hooper.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-green-600 font-semibold">£{row.booter.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-gray-600">£{row.platform.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow System */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Secure Escrow Process</h2>
            <p className="text-gray-600">Your money is protected every step of the way</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Agreement & Lock-In</h3>
                <p className="text-gray-600">
                  Both parties agree on the price. Once locked in (like eBay), the price cannot change.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Payment to Escrow</h3>
                <p className="text-gray-600">
                  Hooper pays their amount (agreed price + 3%). Funds are held securely in escrow—safe and protected.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Delivery</h3>
                <p className="text-gray-600">
                  Booter delivers the item safely to the agreed destination.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-purple-600">4</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Dual Confirmation Required ⚡</h3>
                <p className="text-gray-600 mb-2">
                  <strong>BOTH parties must confirm:</strong>
                </p>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>✅ Booter confirms: "I delivered the item"</li>
                  <li>✅ Hooper confirms: "I received the item in good condition"</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-green-600">5</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Automatic Payment Release</h3>
                <p className="text-gray-600">
                  Once BOTH confirmations are received, payment is automatically released to the Booter. Fair and secure for everyone! 🎉
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-purple-900 mb-2">Why Dual Confirmation?</h4>
                <p className="text-purple-800">
                  This protects both parties. Hoopers confirm they received their item, and Booters confirm they 
                  completed the delivery. Only when both are satisfied is the payment released—ensuring fairness and trust.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What the Fee Covers */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What Do the Fees Cover?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Platform Services</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure matching system</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Messaging and communication</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Rating and review system</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Customer support</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Security & Trust</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Identity verification</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure escrow payments</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Fraud prevention</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dispute resolution</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Payment Processing</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure card processing</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">International transfers</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automatic payouts</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Transaction records</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Platform Maintenance</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Server infrastructure</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Security updates</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Feature improvements</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Mobile app development</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* No Hidden Fees */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
            <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Hidden Fees</h2>
            <p className="text-xl text-gray-700 mb-6">
              What you see is what you pay. No surprises, no additional charges.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">❌ No Listing Fees</p>
                <p className="text-sm text-gray-600">Post journeys or requests for free</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">❌ No Monthly Fees</p>
                <p className="text-sm text-gray-600">Pay only when you transact</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">❌ No Cancellation Fees</p>
                <p className="text-sm text-gray-600">Cancel anytime before acceptance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">When do I pay?</h3>
              <p className="text-gray-600">
                <strong>Hoopers</strong> pay when they accept a Booter's offer. <strong>Booters</strong> receive payment 
                after both parties confirm the delivery is complete.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">What if the delivery isn't completed?</h3>
              <p className="text-gray-600">
                If both parties don't confirm completion, the payment remains in escrow. Our support team will 
                investigate and resolve the issue fairly.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">Can I negotiate the price?</h3>
              <p className="text-gray-600">
                Yes! Booters and Hoopers can message each other to negotiate before locking in the price. 
                Once agreed, the price is locked.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">How do I receive my payment as a Booter?</h3>
              <p className="text-gray-600">
                Payments are automatically transferred to your bank account after both confirmations. 
                Processing typically takes 2-5 business days.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">Are there any additional costs?</h3>
              <p className="text-gray-600">
                No hidden fees from BootHop. However, you may be responsible for customs duties, taxes, 
                or fees imposed by government authorities.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit/debit cards (Visa, Mastercard, Amex) and digital wallets. 
                All payments are processed securely through Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">
            Fair, transparent pricing. Join thousands already using BootHop.
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

