'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, User, Package, DollarSign, AlertTriangle,
  CheckCircle, Shield, Search, Filter,
  Eye, Ban, Mail, Calendar, MapPin,
  TrendingUp, Activity, Download, RefreshCw, Clock,
  Send, MessageSquare, X, ChevronDown, Zap,
  ArrowLeft, HelpCircle, ChevronRight,
} from 'lucide-react';

export default function AdminDashboard({ serverSession }: { serverSession: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'escrow' | 'disputes'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);

  const [showHelp, setShowHelp]                 = useState(false);
  const [nearMissScanning, setNearMissScanning] = useState(false);
  const [nearMissResult, setNearMissResult]     = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails]     = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose]       = useState(false);
  const [composeTemplate, setComposeTemplate] = useState('thankyou');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody]       = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeResult, setComposeResult]   = useState<string | null>(null);

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
    loadDashboardData();
  }, []);

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


  const TEMPLATES: Record<string, { subject: string; body: string }> = {
    thankyou: {
      subject: 'Thank you for using BootHop',
      body: `Hi there,\n\nThank you so much for being part of the BootHop community. We truly appreciate you trusting us to connect senders and travellers across borders.\n\nWe're constantly working to improve our matching — faster notifications, better route coverage, and smarter suggestions — so you spend less time waiting and more time doing.\n\nIf you ever have feedback or questions, just reply to this email. We read every message.\n\nWarm regards,\nThe BootHop Team`,
    },
    matching: {
      subject: `We're improving matching on BootHop`,
      body: `Hi there,\n\nWe've been working hard behind the scenes to make matching on BootHop faster and smarter.\n\nWhat's new:\n• Quicker match notifications\n• Better route coverage across more cities\n• Improved pricing suggestions\n\nIf you have an active listing, keep an eye on your dashboard — matches are happening more frequently than ever.\n\nThank you for your continued support.\n\nThe BootHop Team`,
    },
    promotion: {
      subject: 'Something exciting is coming to BootHop 🚀',
      body: `Hi there,\n\nWe have some exciting news coming to the BootHop community very soon. Stay tuned for updates that will make sending and travelling even better.\n\nIn the meantime, if you haven't listed a trip yet, now is a great time — we have active listings looking for someone like you.\n\nThe BootHop Team`,
    },
    nomatch: {
      subject: `We're still looking for your match on BootHop`,
      body: `Hi there,\n\nWe noticed you have an active listing on BootHop and we haven't found a match for you yet — but we haven't stopped looking.\n\nMatching the right sender with the right traveller takes time, and we want to make sure it's a great fit when it happens. We're constantly growing our network of routes and users, so your chances improve every day.\n\nYou are part of a community that is making cross-border delivery simpler and more affordable for everyone. We appreciate your patience and trust in us.\n\nAs soon as we find a match, you'll hear from us straight away.\n\nWarm regards,\nThe BootHop Team`,
    },
    custom: { subject: '', body: '' },
  };

  const applyTemplate = (key: string) => {
    setComposeTemplate(key);
    setComposeSubject(TEMPLATES[key].subject);
    setComposeBody(TEMPLATES[key].body);
  };

  const toggleEmailSelect = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allEmails = Array.from(new Set(filteredUsers.map((t: any) => t.email).filter(Boolean)));
    if (selectedEmails.size === allEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(allEmails));
    }
  };

  const openCompose = () => {
    setComposeTemplate('thankyou');
    setComposeSubject(TEMPLATES.thankyou.subject);
    setComposeBody(TEMPLATES.thankyou.body);
    setComposeResult(null);
    setShowCompose(true);
  };

  const sendMessage = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) return;
    setComposeSending(true);
    setComposeResult(null);
    try {
      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: Array.from(selectedEmails),
          subject: composeSubject,
          body: composeBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setComposeResult(`✅ Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}`);
    } catch (err: any) {
      setComposeResult(`❌ ${err.message}`);
    } finally {
      setComposeSending(false);
    }
  };

  const runNearMissScan = async () => {
    setNearMissScanning(true);
    setNearMissResult(null);
    try {
      const res  = await fetch('/api/admin/near-miss-scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      if (data.pairs === 0) {
        setNearMissResult('No near-miss pairs found right now.');
      } else {
        setNearMissResult(`⚡ Sent ${data.sent} near-miss alert${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''} across ${data.pairs} pair${data.pairs !== 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      setNearMissResult(`❌ ${err.message}`);
    } finally {
      setNearMissScanning(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      
      {/* ADMIN HEADER */}
      <nav className="bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-xl border-b border-red-400/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">

          {/* LEFT — back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl items-center justify-center shrink-0">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base md:text-xl leading-tight truncate">Admin Control Center</h1>
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-1 text-white/40 text-xs">
                <Link href="/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">Admin</span>
              </div>
            </div>
          </div>

          {/* RIGHT — sub-page links + actions */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Link href="/admin/hub"      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Hub</Link>
            <Link href="/admin/customs"  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Customs</Link>
            <Link href="/admin/business" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Business</Link>
            <button onClick={loadDashboardData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Refresh data">
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2 bg-blue-600/40 hover:bg-blue-600/70 rounded-xl transition-all" title="Help & reference">
              <HelpCircle className="w-4 h-4 text-blue-300" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-semibold text-xs">
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

        {/* NEAR-MISS QUICK ACTION */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={runNearMissScan}
            disabled={nearMissScanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {nearMissScanning
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Zap className="w-4 h-4" />}
            {nearMissScanning ? 'Scanning...' : 'Run Near-Miss Alerts'}
          </button>
          {nearMissResult && (
            <span className={`text-sm font-medium px-4 py-2 rounded-xl ${
              nearMissResult.startsWith('⚡') ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
              nearMissResult.startsWith('❌') ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
              'bg-white/10 text-white/60 border border-white/10'
            }`}>
              {nearMissResult}
            </span>
          )}
          <span className="text-white/30 text-xs ml-auto">Auto-runs daily at 10:00 UTC</span>
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
                <option value="all">All</option>
                <option value="travel">Travellers only</option>
                <option value="sender">Senders only</option>
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="expired">Expired</option>
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
                    <th className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                        checked={filteredUsers.length > 0 && selectedEmails.size === new Set(filteredUsers.map((t: any) => t.email).filter(Boolean)).size}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Route</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Travel Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Weight</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-white/60">
                        No journeys found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((trip: any, i: number) => {
                      const isTraveller = trip.type === 'travel' || trip.type === 'traveller';
                      return (
                        <tr key={trip.id || i} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${trip.email && selectedEmails.has(trip.email) ? 'bg-blue-500/10' : ''}`}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-blue-500 cursor-pointer"
                              checked={!!trip.email && selectedEmails.has(trip.email)}
                              onChange={() => trip.email && toggleEmailSelect(trip.email)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-white/80">
                              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="text-sm">{trip.email || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              isTraveller ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {isTraveller ? '✈️ Traveller' : '📦 Sender'}
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
                          <td className="px-6 py-4 text-white/80 text-sm">
                            {trip.weight ? `${trip.weight} kg` : '—'}
                          </td>
                          <td className="px-6 py-4 text-white font-semibold text-sm">
                            {trip.price ? `£${Number(trip.price).toFixed(2)}` : '—'}
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
                        </tr>
                      );
                    })
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

      {/* HELP PANEL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative w-full max-w-sm h-full bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-bold text-lg">Help &amp; Reference</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Navigation */}
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Navigation</h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { icon: '←', label: 'Back button', desc: 'Returns to the previous page you were on.' },
                    { icon: '🔄', label: 'Refresh', desc: 'Reloads all dashboard data from the database.' },
                    { icon: '🚪', label: 'Exit', desc: 'Takes you back to your main user dashboard.' },
                    { icon: 'Hub', label: 'Hub', desc: 'Africa-outbound match authorisation, payment confirmations, and dispute resolution.' },
                    { icon: 'Customs', label: 'Customs', desc: 'AML review queue and duty/tax estimations for shipments.' },
                    { icon: 'Business', label: 'Business', desc: 'Carrier job management — assign, track, and complete business deliveries.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <span className="shrink-0 w-14 text-xs bg-white/10 text-white/60 rounded-lg px-2 py-1 font-mono text-center leading-relaxed">{item.icon}</span>
                      <div>
                        <p className="text-white font-semibold">{item.label}</p>
                        <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-white/10" />

              {/* Tabs */}
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Dashboard Tabs</h3>
                <div className="space-y-4 text-sm">
                  {[
                    {
                      icon: '✈️📦', label: 'Journeys',
                      desc: 'Every active sender and traveller listing across the platform. Use checkboxes to select customers and send them messages.',
                      tip: 'Filter by "Travellers only" or "Senders only" using the dropdown.',
                    },
                    {
                      icon: '🔗', label: 'Matches',
                      desc: 'Connections between a sender and a traveller that have been proposed or accepted.',
                      tip: 'Click "View Full Details" to see the match page and timeline.',
                    },
                    {
                      icon: '🔒', label: 'Escrow',
                      desc: 'Payments held by BootHop until both parties confirm delivery. "Manual Release" bypasses the dual-confirmation — use with caution.',
                      tip: 'Normal release happens automatically when both sides confirm.',
                    },
                    {
                      icon: '⚠️', label: 'Disputes',
                      desc: 'Issues raised by users during a match. Click "View Match" to investigate and resolve.',
                      tip: '',
                    },
                  ].map(tab => (
                    <div key={tab.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white font-bold mb-1">{tab.icon} {tab.label}</p>
                      <p className="text-white/60 text-xs leading-relaxed">{tab.desc}</p>
                      {tab.tip && <p className="mt-2 text-blue-400 text-xs">💡 {tab.tip}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-white/10" />

              {/* Actions */}
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Admin Actions</h3>
                <div className="space-y-4 text-sm">
                  {[
                    {
                      icon: '⚡', label: 'Near-Miss Alerts',
                      desc: 'Scans for senders and travellers with the same route but travel dates 1–2 days apart. Emails the sender asking if they can be flexible.',
                      tip: 'Also runs automatically every day at 10:00 UTC.',
                    },
                    {
                      icon: '✉️', label: 'Compose Message',
                      desc: 'Tick one or more customers in the Journeys tab, then tap "Compose Message" in the bar that appears at the bottom. Choose a template or write your own.',
                      tip: 'Emails are deduplicated — a customer with 3 listings only gets 1 email.',
                    },
                  ].map(action => (
                    <div key={action.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white font-bold mb-1">{action.icon} {action.label}</p>
                      <p className="text-white/60 text-xs leading-relaxed">{action.desc}</p>
                      {action.tip && <p className="mt-2 text-amber-400 text-xs">💡 {action.tip}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-white/10" />

              {/* Contact */}
              <section className="pb-6">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Support</h3>
                <p className="text-white/60 text-sm">For platform issues or questions, email <span className="text-blue-400">info@boothop.com</span></p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* STICKY SELECTION BAR */}
      {selectedEmails.size > 0 && !showCompose && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-t border-blue-400/30 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {selectedEmails.size}
              </div>
              <span className="text-white font-medium">
                {selectedEmails.size} customer{selectedEmails.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedEmails(new Set())}
                className="text-white/50 hover:text-white text-xs underline"
              >
                Clear
              </button>
            </div>
            <button
              onClick={openCompose}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              Compose Message
            </button>
          </div>
        </div>
      )}

      {/* COMPOSE MODAL */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Compose Message</h3>
                  <p className="text-white/50 text-xs">{selectedEmails.size} recipient{selectedEmails.size !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Template picker */}
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Template</label>
                <div className="relative">
                  <select
                    value={composeTemplate}
                    onChange={e => applyTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer pr-10"
                  >
                    <option value="thankyou">Thank You for Using BootHop</option>
                    <option value="matching">We&apos;re Improving Matching</option>
                    <option value="nomatch">Still Looking for Your Match</option>
                    <option value="promotion">Exciting News Coming Soon</option>
                    <option value="custom">Custom Message</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Message</label>
                <textarea
                  rows={8}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Recipients preview */}
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-white/50 text-xs mb-1.5 font-semibold uppercase tracking-wide">Sending to</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {Array.from(selectedEmails).slice(0, 5).join(', ')}
                  {selectedEmails.size > 5 && <span className="text-white/40"> +{selectedEmails.size - 5} more</span>}
                </p>
              </div>

              {/* Result */}
              {composeResult && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  composeResult.startsWith('✅') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                }`}>
                  {composeResult}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={composeSending || !composeSubject.trim() || !composeBody.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {composeSending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {composeSending ? 'Sending...' : `Send to ${selectedEmails.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

