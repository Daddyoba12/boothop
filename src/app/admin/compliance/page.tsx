import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { requireAdminPage } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCompliancePage() {
  await requireAdminPage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center max-w-md">
        <ShieldAlert className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Compliance Review</h2>
        <p className="text-white/60 mb-6">The compliance_requests table has not been created yet. This section will be active once the table is set up in Supabase.</p>
        <Link href="/admin" className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold">
          ← Back to Admin
        </Link>
      </div>
    </div>
  );
}
