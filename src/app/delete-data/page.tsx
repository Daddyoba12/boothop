import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Your Data | BootHop",
  description: "Request deletion of specific BootHop data without closing your account.",
};

const DELETABLE_DATA = [
  {
    category: "Messages & Chat History",
    description: "All conversation threads with other users",
    retention: "Deleted within 30 days",
  },
  {
    category: "Delivery History",
    description: "Past delivery requests and trip listings you posted",
    retention: "Deleted within 30 days",
  },
  {
    category: "Reviews & Ratings",
    description: "Reviews you have written or received",
    retention: "Deleted within 30 days",
  },
  {
    category: "Saved Payment Methods",
    description: "Stored card or bank details",
    retention: "Deleted within 7 days",
  },
  {
    category: "Profile Photo",
    description: "Your account profile picture",
    retention: "Deleted within 7 days",
  },
  {
    category: "Notification Preferences",
    description: "Saved alert and marketing preferences",
    retention: "Reset within 7 days",
  },
];

export default function DeleteDataPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to BootHop
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-3">Delete Specific Data</h1>
        <p className="text-gray-400 mb-2">
          You can request deletion of specific types of data from your BootHop account — without closing the account itself.
        </p>
        <p className="text-gray-400 mb-10">
          If you want to close your account entirely, see our{" "}
          <Link href="/delete-account" className="text-blue-400 hover:underline">
            Delete Account page
          </Link>
          .
        </p>

        {/* What you can delete */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">What you can request to delete</h2>
          <div className="space-y-3">
            {DELETABLE_DATA.map((item) => (
              <div key={item.category} className="bg-white/5 rounded-xl p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-sm">{item.category}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.description}</p>
                </div>
                <span className="text-xs text-green-400 whitespace-nowrap mt-0.5">{item.retention}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How to request */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">How to submit a request</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <p className="font-medium">Email our privacy team</p>
                <p className="text-gray-400 text-sm mt-1">
                  Send your request to{" "}
                  <a
                    href="mailto:privacy@boothop.com?subject=Data%20Deletion%20Request"
                    className="text-blue-400 hover:underline"
                  >
                    privacy@boothop.com
                  </a>{" "}
                  with the subject line <strong className="text-white">Data Deletion Request</strong>.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <p className="font-medium">Tell us what to delete</p>
                <p className="text-gray-400 text-sm mt-1">
                  Specify which categories of data you want removed (e.g. "delete all my messages" or "remove my delivery history"). Include the email or phone number on your account.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <p className="font-medium">We confirm and action it</p>
                <p className="text-gray-400 text-sm mt-1">
                  We'll confirm receipt within <strong className="text-white">48 hours</strong> and complete the deletion within <strong className="text-white">30 days</strong>. Your account remains active.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* What we must keep */}
        <section className="mb-10 bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">What we must keep</h2>
          <p className="text-gray-400 text-sm mb-3">
            UK financial regulations require us to retain completed transaction records (amounts, dates, parties involved) for up to <strong className="text-white">7 years</strong>. These cannot be deleted on request but are used solely for legal compliance.
          </p>
          <p className="text-gray-500 text-xs">
            All other data is fully deletable on request at any time.
          </p>
        </section>

        {/* Footer */}
        <section className="border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold mb-2">Questions?</h2>
          <p className="text-gray-400 text-sm">
            Email{" "}
            <a href="mailto:privacy@boothop.com" className="text-blue-400 hover:underline">
              privacy@boothop.com
            </a>{" "}
            — we respond within 48 hours.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            BootHop is operated by BootHop Ltd. Registered in England and Wales.
          </p>
        </section>

      </div>
    </main>
  );
}
