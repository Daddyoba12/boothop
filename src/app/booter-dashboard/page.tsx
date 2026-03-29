'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Plus, Plane, TrendingUp, Star, CheckCircle,
  Clock, MessageSquare, ArrowRight, LogOut, User,
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import type { Profile, Journey, DeliveryMatch } from '@/lib/supabase';

// ── Status badge ─────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:      'bg-green-100 text-green-700',
    completed:   'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    in_transit:  'bg-yellow-100 text-yellow-700',
    accepted:    'bg-amber-100 text-amber-700',
    pending:     'bg-slate-100 text-slate-600',
    cancelled:   'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, sub, color,
}: {
  icon: React.ReactNode; value: string; label: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-0.5">{value}</div>
      <div className="text-slate-500 text-sm">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function BooterDashboard() {
  const router   = useRouter();
  const supabase = createSupabaseClient();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [matches,  setMatches]  = useState<DeliveryMatch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const [{ data: prof }, { data: jrns }, { data: mtchs }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('journeys').select('*').eq('booter_id', user.id).order('departure_date', { ascending: true }),
          supabase.from('delivery_matches').select('*').eq('booter_id', user.id).order('created_at', { ascending: false }),
        ]);

        setProfile(prof);
        setJourneys(jrns ?? []);
        setMatches(mtchs ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeJourneys     = journeys.filter((j) => j.status === 'active');
  const completedDeliveries = profile?.completed_deliveries ?? 0;
  const totalEarnings      = matches.filter((m) => m.status === 'completed').reduce((s, m) => s + Number(m.booter_receives), 0);
  const rating             = profile?.rating ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const initials = profile?.full_name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">Boot<span className="text-blue-600">Hop</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '/journeys',         label: 'Journeys' },
                { href: '/requests',         label: 'Requests' },
                { href: '/messages',         label: 'Messages' },
              ].map((l) => (
                <Link key={l.href} href={l.href}
                  className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition">
                  {l.label}
                </Link>
              ))}
            </div>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {profile?.full_name}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-slide-down">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <User className="h-4 w-4" /> Profile Settings
                  </Link>
                  <hr className="border-slate-100 my-1" />
                  <button
                    onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Manage your journeys and track your earnings</p>
          </div>
          <Link
            href="/journeys/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" /> Post New Journey
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Plane className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50" value={String(activeJourneys.length)}
            label="Active Journeys" sub="Currently live"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="bg-green-50" value={String(completedDeliveries)}
            label="Completed Deliveries" sub="All time"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
            color="bg-violet-50" value={`£${totalEarnings.toFixed(2)}`}
            label="Total Earnings" sub="After platform fees"
          />
          <StatCard
            icon={<Star className="h-5 w-5 text-amber-500" />}
            color="bg-amber-50" value={rating > 0 ? rating.toFixed(1) : '—'}
            label="Your Rating" sub={`Based on ${profile?.total_deliveries ?? 0} reviews`}
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/requests"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-slate-300 hover:shadow-sm transition">
            <Package className="h-4 w-4" /> Browse Requests
          </Link>
          <Link href="/messages"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-slate-300 hover:shadow-sm transition">
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
          <Link href="/journeys"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-slate-300 hover:shadow-sm transition">
            <Plane className="h-4 w-4" /> All Journeys
          </Link>
        </div>

        {/* Active journeys table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Active Journeys</h2>
            <Link href="/journeys" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeJourneys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Plane className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">No active journeys yet</p>
              <p className="text-slate-400 text-sm mb-5">Post your first journey to start earning</p>
              <Link href="/journeys/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" /> Post Journey
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeJourneys.slice(0, 5).map((j) => (
                <div key={j.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition"
                  onClick={() => router.push(`/journeys/${j.id}`)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Plane className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {j.from_city} → {j.to_city}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(j.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        &nbsp;·&nbsp;{j.available_space_kg}kg space
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge status={j.status} />
                    <span className="text-xs text-slate-400 hidden sm:block">{j.delivery_matches} match{j.delivery_matches !== 1 ? 'es' : ''}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery matches */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Delivery Matches</h2>
            <Link href="/matches" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">No matches yet</p>
              <p className="text-slate-400 text-sm">Matches appear when Hoopers request deliveries on your route</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {matches.slice(0, 5).map((m) => (
                <div key={m.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition"
                  onClick={() => router.push(`/matches/${m.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Delivery Match</p>
                      <p className="text-xs text-slate-500">Agreed £{Number(m.agreed_price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge status={m.status} />
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-green-600">£{Number(m.booter_receives).toFixed(2)}</div>
                      <div className="text-xs text-slate-400">you receive</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
