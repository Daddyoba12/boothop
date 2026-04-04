'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Plane, CheckCircle, Clock, XCircle, 
  ArrowRight, DollarSign, MapPin, Calendar, TrendingUp,
  User, Shield, AlertCircle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeMatches: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'trips'>('matches');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Load matches where user is either sender or traveler
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          sender_trip:sender_trip_id(from_city, to_city, travel_date, price),
          traveler_trip:traveler_trip_id(from_city, to_city, travel_date, price)
        `)
        .or(`sender_trip_id.user_id.eq.${currentUser.id},traveler_trip_id.user_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      setMatches(matchesData || []);

      // Load user's trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setTrips(tripsData || []);

      // Calculate stats
      const active = matchesData?.filter(m => m.status === 'pending' || m.status === 'accepted').length || 0;
      const completed = matchesData?.filter(m => m.status === 'completed').length || 0;
      const earnings = matchesData
        ?.filter(m => m.status === 'completed' && m.booter_receives)
        .reduce((sum, m) => sum + Number(m.booter_receives), 0) || 0;
      const pending = matchesData
        ?.filter(m => m.payment_status === 'escrowed')
        .reduce((sum, m) => sum + Number(m.booter_receives || 0), 0) || 0;

      setStats({
        activeMatches: active,
        completedDeliveries: completed,
        totalEarnings: earnings,
        pendingPayments: pending
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const getMatchStatus = (match: any) => {
    switch (match.status) {
      case 'matched':         return { label: 'Matched',       color: 'blue',   icon: Clock };
      case 'pending':         return { label: 'Pending',       color: 'yellow', icon: Clock };
      case 'accepted':        return { label: 'Accepted',      color: 'blue',   icon: Clock };
      case 'kyc_pending':     return { label: 'ID Check',      color: 'violet', icon: Shield };
      case 'kyc_complete':    return { label: 'ID Verified',   color: 'green',  icon: CheckCircle };
      case 'payment_pending': return { label: 'Awaiting Pay',  color: 'amber',  icon: Clock };
      case 'payment_held':    return { label: 'Escrow Held',   color: 'amber',  icon: Shield };
      case 'active':          return { label: 'Active',        color: 'blue',   icon: CheckCircle };
      case 'completed':       return { label: 'Completed',     color: 'green',  icon: CheckCircle };
      case 'released':        return { label: 'Paid Out',      color: 'green',  icon: CheckCircle };
      case 'declined':        return { label: 'Declined',      color: 'red',    icon: XCircle };
      case 'cancelled':       return { label: 'Cancelled',     color: 'red',    icon: XCircle };
      default:                return { label: match.status ?? 'Unknown', color: 'gray', icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Package className="w-16 h-16 text-blue-400 animate-bounce" />
      </div>
    );
  }

  // Empty state — no trips and no matches → guide user to create first journey
  if (!loading && trips.length === 0 && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 w-20 h-20 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
          <Package className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No journeys or matches yet</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-sm">
          Create your first journey to get matched with senders or travellers on your route.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/register?type=travel"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Plane className="h-4 w-4" /> I&apos;m Travelling
          </Link>
          <Link
            href="/register?type=send"
            className="flex items-center justify-center gap-2 border border-white/12 hover:bg-white/5 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <Package className="h-4 w-4" /> I Want to Send
          </Link>
        </div>
        <Link href="/journeys" className="mt-6 text-sm text-slate-500 hover:text-cyan-400 transition-colors">
          Or browse live journeys →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      
      {/* HEADER */}
      <nav className="bg-white/10 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Plane className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="font-bold text-white">
              Boot<span className="text-blue-400">Hop</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <User className="w-5 h-5 text-white/60" />
              <span className="text-white text-sm">{user?.email}</span>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* WELCOME SECTION */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-white/60 text-lg">
            Here's what's happening with your deliveries
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Active Matches</p>
                <p className="text-3xl font-bold text-white">{stats.activeMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Completed</p>
                <p className="text-3xl font-bold text-white">{stats.completedDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-white">£{stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">In Escrow</p>
                <p className="text-3xl font-bold text-white">£{stats.pendingPayments.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            🤝 My Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'trips'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            ✈️ My Trips ({trips.length})
          </button>
        </div>

        {/* MATCHES LIST */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No matches yet</h3>
                <p className="text-white/60 mb-6">Post a trip or delivery request to get started</p>
                <Link
                  href="/"
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all"
                >
                  Create Request
                </Link>
              </div>
            ) : (
              matches.map((match) => {
                const status = getMatchStatus(match);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={match.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                        status.color === 'green' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                        status.color === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                        status.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                        'bg-red-500/20 text-red-300 border border-red-400/30'
                      }`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </div>

                      {match.payment_status === 'escrowed' && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <Shield className="w-4 h-4" />
                          <span>Payment Secured</span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Route</p>
                          <p className="text-white font-semibold">
                            {match.sender_trip.from_city} → {match.sender_trip.to_city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Date</p>
                          <p className="text-white font-semibold">
                            {new Date(match.sender_trip.travel_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-white/60 text-sm">Amount</p>
                          <p className="text-white font-semibold">
                            £{Number(match.agreed_price || match.sender_trip.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all group-hover:scale-105"
                    >
                      View Details
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TRIPS LIST */}
        {activeTab === 'trips' && (
          <div className="space-y-4">
            {trips.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Plane className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No trips posted</h3>
                <p className="text-white/60 mb-6">Create your first trip to start matching</p>
                <Link
                  href="/"
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all"
                >
                  Post Trip
                </Link>
              </div>
            ) : (
              trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        trip.type === 'travel' 
                          ? 'bg-blue-500/20' 
                          : 'bg-purple-500/20'
                      }`}>
                        {trip.type === 'travel' ? (
                          <Plane className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Package className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {trip.from_city} → {trip.to_city}
                        </p>
                        <p className="text-white/60 text-sm">
                          {trip.type === 'travel' ? 'Traveling' : 'Sending Package'}
                        </p>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      trip.status === 'matched' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {trip.status === 'matched' ? '✅ Matched' : '🔍 Looking for match'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Date</p>
                      <p className="text-white">{new Date(trip.travel_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Price</p>
                      <p className="text-white">£{Number(trip.price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Posted</p>
                      <p className="text-white">{new Date(trip.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
