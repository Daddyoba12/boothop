'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, User, Package, DollarSign, AlertTriangle,
  CheckCircle, Shield, Search, Filter,
  Eye, Ban, Mail, Calendar, MapPin,
  TrendingUp, Activity, Download, RefreshCw, Clock,
} from 'lucide-react';

export default function AdminDashboard({ serverSession }: { serverSession: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'escrow' | 'disputes'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    activeMatches: 0,
    completedMatches: 0,
    escrowAmount: 0,
    releasedAmount: 0,
    pendingDisputes: 0,
    platformRevenue: 0
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    // Server component already verified admin access before rendering this page.
    // serverSession is guaranteed to exist and belong to an admin email.
    if (!serverSession?.user) {
      router.push('/login?next=/admin');
      return;
    }
    setIsAdmin(true);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      const res  = await fetch('/api/admin/dashboard-data');
      const data = await res.json();

      const usersData    = data.users    || [];
      const matchesData  = data.matches  || [];
      const escrowData   = data.escrow   || [];
      const disputesData = data.disputes || [];

      setUsers(usersData);
      setMatches(matchesData);
      setEscrowPayments(escrowData);
      setDisputes(disputesData);

      const activeCount      = matchesData.filter((m: any) => m.status === 'accepted' || m.status === 'in_transit').length;
      const completedCount   = matchesData.filter((m: any) => m.status === 'completed').length;
      const escrowSum        = escrowData.reduce((s: number, m: any) => s + Number(m.agreed_price || 0), 0);
      const releasedSum      = matchesData.filter((m: any) => m.payment_status === 'released').reduce((s: number, m: any) => s + Number(m.agreed_price || 0), 0);
      const pendingDisputes  = disputesData.filter((d: any) => d.status === 'open' || d.status === 'pending').length;
      const revenue          = matchesData.filter((m: any) => m.status === 'completed').reduce((s: number, m: any) => s + (Number(m.hooper_pays || 0) - Number(m.booter_receives || 0)), 0);

      setStats({
        totalUsers: usersData.length,
        verifiedUsers: 0,
        activeMatches: activeCount,
        completedMatches: completedCount,
        escrowAmount: escrowSum,
        releasedAmount: releasedSum,
        pendingDisputes,
        platformRevenue: revenue,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  const releaseEscrow = async (matchId: string) => {
    if (!confirm('⚠️ Are you sure you want to manually release this escrow payment?')) return;
    try {
      const res = await fetch('/api/admin/release-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert('✅ Escrow released successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      alert('❌ Failed to release escrow');
    }
  };


  const filteredUsers = users.filter(trip => {
    const matchesSearch = !searchQuery ||
      trip.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.from_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to_city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus || trip.type === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.sender_trip?.from_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.sender_trip?.to_city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || match.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-20 h-20 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-white/70">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      
      {/* PREMIUM ADMIN HEADER */}
      <nav className="bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-xl border-b border-red-400/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">Admin Control Center</h1>
              <p className="text-white/60 text-sm">BootHop System Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/hub" className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-sm font-medium">Hub</Link>
            <Link href="/admin/customs" className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-sm font-medium">Customs</Link>
            <Link href="/admin/business" className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-sm font-medium">Business</Link>
            <button
              onClick={loadDashboardData}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* ENHANCED STATS GRID */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {/* Total Users */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-white/60 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalUsers}</p>
            <p className="text-xs text-green-400">
              {stats.verifiedUsers} KYC verified ({stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(0) : 0}%)
            </p>
          </div>

          {/* Active Matches */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-white" />
              </div>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-white/60 text-sm mb-1">Active Matches</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.activeMatches}</p>
            <p className="text-xs text-blue-400">
              {stats.completedMatches} completed
            </p>
          </div>

          {/* Escrow Amount */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-white/60 text-sm mb-1">In Escrow</p>
            <p className="text-3xl font-bold text-white mb-2">£{stats.escrowAmount.toFixed(2)}</p>
            <p className="text-xs text-yellow-400">
              £{stats.releasedAmount.toFixed(2)} released
            </p>
          </div>

          {/* Platform Revenue */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-white/60 text-sm mb-1">Platform Revenue</p>
            <p className="text-3xl font-bold text-white mb-2">£{stats.platformRevenue.toFixed(2)}</p>
            <p className="text-xs text-green-400">
              From fees
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search users, matches, emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Export Button */}
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'users',    label: 'Users',    icon: Users,          count: users.length },
            { key: 'matches',  label: 'Matches',  icon: Package,        count: matches.length },
            { key: 'escrow',   label: 'Escrow',   icon: Shield,         count: escrowPayments.length },
            { key: 'disputes', label: 'Disputes', icon: AlertTriangle,  count: disputes.length },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-3 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* JOURNEYS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Route</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Travel Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Listed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-white/60">
                        No journeys found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((trip: any, i: number) => (
                      <tr key={trip.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white/80">
                            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-sm">{trip.email || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            trip.type === 'traveller' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {trip.type === 'traveller' ? '✈️ Traveller' : '📦 Sender'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-white font-medium text-sm">
                            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                            {trip.from_city} → {trip.to_city}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm">
                          {trip.travel_date ? new Date(trip.travel_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            trip.status === 'active'   ? 'bg-green-500/20 text-green-300' :
                            trip.status === 'matched'  ? 'bg-blue-500/20 text-blue-300' :
                            trip.status === 'expired'  ? 'bg-red-500/20 text-red-300' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {trip.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/50 text-sm">
                          {trip.created_at ? new Date(trip.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No matches found</p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          {match.sender_trip?.from_city} → {match.sender_trip?.to_city}
                        </p>
                        <p className="text-white/60 text-sm">Match ID: {match.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      match.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                      match.status === 'accepted' || match.status === 'in_transit' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                      match.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                      'bg-red-500/20 text-red-300 border-red-400/30'
                    }`}>
                      {match.status}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm mb-4 bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-white/50 text-xs">Sender (Hooper)</p>
                        <p className="text-white font-medium">{match.hooper_email || match.sender_email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-400 shrink-0" />
                      <div>
                        <p className="text-white/50 text-xs">Traveller (Booter)</p>
                        <p className="text-white font-medium">{match.booter_email || match.traveler_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-white/60 mb-1">Payment Status</p>
                      <p className="text-white font-medium">{match.payment_status || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/60 mb-1">Amount</p>
                      <p className="text-white font-medium">£{Number(match.agreed_price || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/60 mb-1">Travel Date</p>
                      <p className="text-white font-medium">
                        {match.sender_trip?.travel_date ? new Date(match.sender_trip.travel_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 mb-1">Created</p>
                      <p className="text-white font-medium">
                        {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 mb-1">Confirmations</p>
                      <p className="text-white font-medium">
                        {match.booter_confirmed_delivery && match.hooper_confirmed_receipt ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Both
                          </span>
                        ) : (
                          <span className="text-yellow-400">Pending</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    View Full Details
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* ESCROW TAB */}
        {activeTab === 'escrow' && (
          <div className="space-y-4">
            {escrowPayments.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <DollarSign className="w-20 h-20 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Payments in Escrow</h3>
                <p className="text-white/60">All payments have been released or no payments are pending</p>
              </div>
            ) : (
              escrowPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white font-bold text-2xl mb-1">
                        £{Number(payment.agreed_price).toFixed(2)}
                      </p>
                      <p className="text-white/60 text-sm">Match ID: {payment.id.slice(0, 12)}...</p>
                    </div>
                    <div className="px-5 py-3 bg-yellow-500/20 text-yellow-300 rounded-xl text-sm font-bold flex items-center gap-2 border border-yellow-400/30">
                      <Shield className="w-5 h-5" />
                      Escrowed
                    </div>
                  </div>

                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Booter Confirmation */}
                    <div className={`p-4 rounded-xl border-2 ${
                      payment.booter_confirmed_delivery 
                        ? 'bg-green-500/10 border-green-400/50' 
                        : 'bg-white/5 border-white/20'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        {payment.booter_confirmed_delivery ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-400" />
                        )}
                        <div>
                          <p className="font-semibold text-white">Traveler (Booter)</p>
                          <p className="text-xs text-white/60">Delivery confirmation</p>
                        </div>
                      </div>
                      {payment.booter_confirmed_delivery ? (
                        <div className="text-sm">
                          <p className="text-green-400 font-medium">✅ Confirmed</p>
                          <p className="text-white/60 text-xs mt-1">
                            {new Date(payment.booter_confirmed_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-400 text-sm">⏳ Awaiting confirmation</p>
                      )}
                    </div>

                    {/* Hooper Confirmation */}
                    <div className={`p-4 rounded-xl border-2 ${
                      payment.hooper_confirmed_receipt 
                        ? 'bg-green-500/10 border-green-400/50' 
                        : 'bg-white/5 border-white/20'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        {payment.hooper_confirmed_receipt ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-400" />
                        )}
                        <div>
                          <p className="font-semibold text-white">Sender (Hooper)</p>
                          <p className="text-xs text-white/60">Receipt confirmation</p>
                        </div>
                      </div>
                      {payment.hooper_confirmed_receipt ? (
                        <div className="text-sm">
                          <p className="text-green-400 font-medium">✅ Confirmed</p>
                          <p className="text-white/60 text-xs mt-1">
                            {new Date(payment.hooper_confirmed_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-400 text-sm">⏳ Awaiting confirmation</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Payment Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Agreed Price:</span>
                        <span className="text-white font-semibold">£{Number(payment.agreed_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Hooper Pays:</span>
                        <span className="text-blue-400 font-semibold">£{Number(payment.hooper_pays || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Booter Receives:</span>
                        <span className="text-green-400 font-semibold">£{Number(payment.booter_receives || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between">
                        <span className="text-white/60">Platform Fee:</span>
                        <span className="text-purple-400 font-semibold">
                          £{(Number(payment.hooper_pays || 0) - Number(payment.booter_receives || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-200">
                        <p className="font-semibold mb-1">⚠️ Admin Override Warning</p>
                        <p className="text-orange-300/80">
                          Manual release should only be used in exceptional cases after thorough investigation. 
                          This bypasses the normal dual-confirmation process.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link
                      href={`/matches/${payment.id}`}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      View Match Details
                    </Link>
                    <button
                      onClick={() => releaseEscrow(payment.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-5 h-5" />
                      Manual Release Escrow
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}


        {/* DISPUTES TAB */}
        {activeTab === 'disputes' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {disputes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Disputes</h3>
                <p className="text-white/60 mb-6">No disputes have been reported yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Dispute</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Match ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Raised</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{dispute.reason || 'No reason given'}</p>
                          <p className="text-white/50 text-xs mt-0.5">ID: {dispute.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm font-mono">
                          {dispute.match_id?.slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{new Date(dispute.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit flex items-center gap-1 ${
                            dispute.status === 'resolved'
                              ? 'bg-green-500/20 text-green-300'
                              : dispute.status === 'open' || dispute.status === 'pending'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {dispute.status || 'open'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/matches/${dispute.match_id}`}
                            className="px-4 py-2 bg-blue-600/80 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-1 w-fit"
                          >
                            <Eye className="w-4 h-4" />
                            View Match
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

