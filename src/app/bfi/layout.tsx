import { requireAdminPage } from '@/lib/auth/admin';
import Link from 'next/link';

export default async function BFILayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/bfi" className="flex items-center gap-2 font-bold text-white">
              <span className="text-blue-400">✈</span>
              <span className="text-sm tracking-widest uppercase">Flight Intelligence</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/bfi"            className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Mission Control</Link>
              <Link href="/bfi/routes"     className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Routes</Link>
              <Link href="/bfi/analytics"  className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Click Intel</Link>
              <Link href="/bfi/airlines"   className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Airlines</Link>
              <Link href="/bfi/providers"  className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Providers</Link>
              <Link href="/bfi/reports"    className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Reports</Link>
              <Link href="/bfi/logs"       className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Logs</Link>
              <Link href="/bfi/alerts"     className="px-3 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">Alerts</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              BFI v0.1 Sprint 1
            </span>
            <Link href="/admin" className="text-gray-400 hover:text-white">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
