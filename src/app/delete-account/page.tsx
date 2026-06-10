import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Your Account | BootHop",
  description: "How to request deletion of your BootHop account and personal data.",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to BootHop
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-3">Delete Your BootHop Account</h1>
        <p className="text-gray-400 mb-10">
          You can request full deletion of your account and associated personal data at any time. There are no fees and no lock-in period.
        </p>

        {/* Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">How to request deletion</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <p className="font-medium">Send an email to our privacy team</p>
                <p className="text-gray-400 text-sm mt-1">
                  Email{" "}
                  <a href="mailto:privacy@boothop.com?subject=Account%20Deletion%20Request" className="text-blue-400 hover:underline">
                    privacy@boothop.com
                  </a>{" "}
                  with the subject line <strong className="text-white">Account Deletion Request</strong>.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <p className="font-medium">Include your account details</p>
                <p className="text-gray-400 text-sm mt-1">
                  Tell us the email address or phone number associated with your BootHop account so we can locate and verify it.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <p className="font-medium">We confirm and delete</p>
                <p className="text-gray-400 text-sm mt-1">
                  We will send a confirmation email within <strong className="text-white">48 hours</strong>. Your account and data will be permanently deleted within <strong className="text-white">30 days</strong> of your request.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* What gets deleted */}
        <section className="mb-10 bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">What gets deleted</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            {[
              "Your profile (name, photo, bio, contact details)",
              "All delivery requests you posted",
              "All trip listings you created",
              "Messages and chat history",
              "Saved payment methods",
              "Notifications and preferences",
              "Reviews and ratings you gave or received",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* What's retained */}
        <section className="mb-10 bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">What we must keep</h2>
          <p className="text-gray-400 text-sm mb-3">
            UK financial regulations require us to retain certain transaction records. The following are kept for up to <strong className="text-white">7 years</strong> after account deletion, then permanently destroyed:
          </p>
          <ul className="space-y-2 text-gray-300 text-sm">
            {[
              "Completed transaction records (amounts, dates, parties)",
              "Invoices and receipts",
              "Dispute and resolution records",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-500 text-xs mt-4">
            These records are kept solely for legal compliance and are not used for marketing or shared with third parties.
          </p>
        </section>

        {/* In-app option */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Delete from within the app</h2>
          <p className="text-gray-400 text-sm">
            You can also submit a deletion request directly from the BootHop app:
          </p>
          <ol className="mt-3 space-y-1 text-gray-300 text-sm list-decimal list-inside">
            <li>Open BootHop and sign in</li>
            <li>Go to <strong className="text-white">Profile → Settings → Account</strong></li>
            <li>Tap <strong className="text-white">Delete Account</strong> and follow the prompts</li>
          </ol>
        </section>

        {/* Contact */}
        <section className="border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold mb-2">Questions?</h2>
          <p className="text-gray-400 text-sm">
            Contact us at{" "}
            <a href="mailto:privacy@boothop.com" className="text-blue-400 hover:underline">
              privacy@boothop.com
            </a>{" "}
            — we typically respond within 48 hours.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            BootHop is operated by BootHop Ltd. Registered in England and Wales.
          </p>
        </section>

      </div>
    </main>
  );
}
