'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Package, DollarSign, AlertTriangle,
  CheckCircle, Shield, Search, Filter,
  Eye, Mail, Calendar, MapPin,
  TrendingUp, Activity, Download, RefreshCw, Clock,
  Send, MessageSquare, X, ChevronDown, Zap,
  ArrowLeft, HelpCircle, ChevronRight,
  Plus,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminDashboard({ serverSession }: { serverSession: any }) {
  const router = useRouter();

  // original state
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'journeys' | 'matches' | 'escrow' | 'disputes'>('journeys');
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [users, setUsers]                     = useState<any[]>([]);
  const [matches, setMatches]                 = useState<any[]>([]);
  const [escrowPayments, setEscrowPayments]   = useState<any[]>([]);
  const [disputes, setDisputes]               = useState<any[]>([]);

  const [showHelp, setShowHelp]                 = useState(false);
  const [nearMissScanning, setNearMissScanning] = useState(false);
  const [nearMissResult, setNearMissResult]     = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails]     = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose]           = useState(false);
  const [composeTemplate, setComposeTemplate]   = useState('thankyou');
  const [composeSubject, setComposeSubject]     = useState('');
  const [composeBody, setComposeBody]           = useState('');
  const [composeSending, setComposeSending]     = useState(false);
  const [composeResult, setComposeResult]       = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalUsers: 0, verifiedUsers: 0, activeMatches: 0, completedMatches: 0,
    escrowAmount: 0, releasedAmount: 0, pendingDisputes: 0, platformRevenue: 0,
  });

  // journey command state
  const [sortField, setSortField] = useState<'date' | 'status' | 'route'>('date');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');

  const [actionResult, setActionResult]   = useState<string | null>(null);

  const [showAddJourney, setShowAddJourney] = useState(false);
  const [addForm, setAddForm] = useState({
    from_city: '', to_city: '', travel_date: '', weight: '', price: '', type: 'travel',
  });
  const [addBusy, setAddBusy]   = useState(false);
  const [addError, setAddError] = useState('');

  // ── data loading ─────────────────────────────────────────────────────────

  useEffect(() => { loadDashboardData(); }, []);

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

      const activeCount    = matchesData.filter((m: any) => m.status === 'accepted' || m.status === 'in_transit').length;
      const completedCount = matchesData.filter((m: any) => m.status === 'completed').length;
      const escrowSum      = escrowData.reduce((s: number, m: any) => s + Number(m.agreed_price || 0), 0);
      const releasedSum    = matchesData.filter((m: any) => m.payment_status === 'released').reduce((s: number, m: any) => s + Number(m.agreed_price || 0), 0);
      const pendingDisputeCount = disputesData.filter((d: any) => d.status === 'open' || d.status === 'pending').length;
      const revenue        = matchesData.filter((m: any) => m.status === 'completed').reduce((s: number, m: any) => s + (Number(m.hooper_pays || 0) - Number(m.booter_receives || 0)), 0);

      setStats({
        totalUsers: usersData.length, verifiedUsers: 0,
        activeMatches: activeCount, completedMatches: completedCount,
        escrowAmount: escrowSum, releasedAmount: releasedSum,
        pendingDisputes: pendingDisputeCount, platformRevenue: revenue,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setLoading(false);
    }
  };

  // ── escrow ────────────────────────────────────────────────────────────────

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
    } catch (err) {
      console.error(err);
      alert('❌ Failed to release escrow');
    }
  };

  // ── journey handlers ──────────────────────────────────────────────────────

  const handleAddJourney = async () => {
    if (!addForm.from_city || !addForm.to_city || !addForm.travel_date) {
      setAddError('From city, to city, and travel date are required');
      return;
    }
    setAddBusy(true);
    setAddError('');
    try {
      const res  = await fetch('/api/admin/journeys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAddJourney(false);
      setAddForm({ from_city: '', to_city: '', travel_date: '', weight: '', price: '', type: 'travel' });
      loadDashboardData();
      setActionResult('✅ Journey posted as Künle A Aluko — now active.');
    } catch (err: any) {
      setAddError(err.message);
    }
    setAddBusy(false);
  };

  // ── filtering & sorting ───────────────────────────────────────────────────

  const filteredUsers = useMemo(() => users.filter(trip => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      trip.email?.toLowerCase().includes(q) ||
      trip.from_city?.toLowerCase().includes(q) ||
      trip.to_city?.toLowerCase().includes(q);
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus || trip.type === filterStatus;
    return matchesSearch && matchesFilter;
  }), [users, searchQuery, filterStatus]);

  const sortedJourneys = useMemo(() => {
    const compare = (a: any, b: any) => {
      if (sortField === 'date') {
        const at = new Date(a.travel_date || a.created_at || 0).getTime();
        const bt = new Date(b.travel_date || b.created_at || 0).getTime();
        return sortDir === 'desc' ? bt - at : at - bt;
      }
      if (sortField === 'status') {
        const as = a.status || '';
        const bs = b.status || '';
        return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
      }
      const ar = `${a.from_city}${a.to_city}`;
      const br = `${b.from_city}${b.to_city}`;
      return sortDir === 'asc' ? ar.localeCompare(br) : br.localeCompare(ar);
    };
    const nowMs = Date.now();
    const isLiveActive = (t: any) =>
      t.status === 'active' && (!t.travel_date || new Date(t.travel_date).getTime() >= nowMs);
    const active = filteredUsers.filter(isLiveActive).sort(compare);
    const rest   = filteredUsers.filter((t: any) => !isLiveActive(t)).sort(compare);
    return [...active, ...rest];
  }, [filteredUsers, sortField, sortDir]);

  const filteredMatches = useMemo(() => matches.filter(match => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      match.sender_trip?.from_city?.toLowerCase().includes(q) ||
      match.sender_trip?.to_city?.toLowerCase().includes(q);
    const matchesFilter = filterStatus === 'all' || match.status === filterStatus;
    return matchesSearch && matchesFilter;
  }), [matches, searchQuery, filterStatus]);

  // ── email compose ─────────────────────────────────────────────────────────

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
      const res  = await fetch('/api/admin/send-message', {
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
      setNearMissResult(
        data.pairs === 0
          ? 'No near-miss pairs found right now.'
          : `⚡ Sent ${data.sent} near-miss alert${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''} across ${data.pairs} pair${data.pairs !== 1 ? 's' : ''}`
      );
    } catch (err: any) {
      setNearMissResult(`❌ ${err.message}`);
    } finally {
      setNearMissScanning(false);
    }
  };

  // ── sort column header ────────────────────────────────────────────────────

  const SortTh = ({ field, label }: { field: 'date' | 'status' | 'route'; label: string }) => (
    <th
      className="px-6 py-4 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:text-blue-700 transition-colors select-none"
      onClick={() => {
        if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('desc'); }
      }}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className={`text-xs ${sortField === field ? 'text-blue-600' : 'text-slate-600'}`}>
          {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );

  // ── loading screen ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-20 h-20 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-700">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 backdrop-blur-xl border-b border-red-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="p-2 bg-slate-100 hover:bg-slate-100 rounded-xl transition-all shrink-0" title="Go back">
              <ArrowLeft className="w-5 h-5 text-slate-900" />
            </button>
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl items-center justify-center shrink-0">
              <Shield className="text-slate-900 w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-base md:text-xl leading-tight truncate">Admin Control Centre</h1>
              <div className="hidden md:flex items-center gap-1 text-slate-600 text-xs">
                <Link href="/dashboard" className="hover:text-slate-700 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-600">Admin</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Link href="/admin/hub"      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all text-xs font-semibold">Hub</Link>
            <Link href="/admin/customs"  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all text-xs font-semibold">Customs</Link>
            <Link href="/admin/business" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all text-xs font-semibold">Business</Link>
            <Link href="/admin/downloads" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-all text-xs font-semibold">Downloads</Link>
            <button onClick={loadDashboardData} className="p-2 bg-slate-100 hover:bg-slate-100 rounded-xl transition-all" title="Refresh">
              <RefreshCw className="w-4 h-4 text-slate-900" />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2 bg-blue-600/40 hover:bg-blue-600/70 rounded-xl transition-all" title="Help">
              <HelpCircle className="w-4 h-4 text-blue-700" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl transition-all font-semibold text-xs">
              Exit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── STATS GRID ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Journeys', value: stats.totalUsers,      sub: `${stats.verifiedUsers} KYC verified`,         icon: Users,      from: 'from-blue-500',   to: 'to-cyan-500',   accent: 'text-green-600',  iconRight: TrendingUp },
            { label: 'Active Matches', value: stats.activeMatches,   sub: `${stats.completedMatches} completed`,          icon: Package,    from: 'from-green-500',  to: 'to-emerald-500', accent: 'text-blue-600', iconRight: Activity },
            { label: 'In Escrow',      value: `£${stats.escrowAmount.toFixed(2)}`,  sub: `£${stats.releasedAmount.toFixed(2)} released`, icon: DollarSign, from: 'from-yellow-500', to: 'to-orange-500', accent: 'text-yellow-600', iconRight: Shield },
            { label: 'Platform Revenue', value: `£${stats.platformRevenue.toFixed(2)}`, sub: 'From fees',               icon: TrendingUp, from: 'from-purple-500', to: 'to-pink-500',   accent: 'text-green-600',  iconRight: CheckCircle },
          ].map(s => {
            const Icon  = s.icon;
            const IconR = s.iconRight;
            return (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-100 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-slate-900" />
                  </div>
                  <IconR className={`w-5 h-5 ${s.accent}`} />
                </div>
                <p className="text-slate-600 text-sm mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-slate-900 mb-2">{s.value}</p>
                <p className={`text-xs ${s.accent}`}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── NEAR-MISS ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={runNearMissScan}
            disabled={nearMissScanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {nearMissScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {nearMissScanning ? 'Scanning...' : 'Run Near-Miss Alerts'}
          </button>
          {nearMissResult && (
            <span className={`text-sm font-medium px-4 py-2 rounded-xl ${
              nearMissResult.startsWith('⚡') ? 'bg-amber-500/20 text-amber-700 border border-amber-400/30' :
              nearMissResult.startsWith('❌') ? 'bg-red-500/20 text-red-700 border border-red-400/30' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {nearMissResult}
            </span>
          )}
          <span className="text-slate-600 text-xs ml-auto">Auto-runs daily at 10:00 UTC</span>
        </div>

        {/* ── SEARCH & FILTER ───────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                type="text"
                placeholder="Search by email, route, city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-3 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="travel">Travellers only</option>
                <option value="sender">Senders only</option>
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="expired">Expired</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* ── TABS ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'journeys', label: 'Journeys', icon: Users,         count: users.length },
            { key: 'matches',  label: 'Matches',  icon: Package,       count: matches.length },
            { key: 'escrow',   label: 'Escrow',   icon: Shield,        count: escrowPayments.length },
            { key: 'disputes', label: 'Disputes', icon: AlertTriangle, count: disputes.length },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-3 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${activeTab === tab.key ? 'bg-slate-100' : 'bg-slate-100'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            JOURNEYS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'journeys' && (
          <div>
            {/* tab toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Active — pinned to top
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  Past / Cancelled
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
                  Click any row for full details
                </div>
              </div>
              <button
                onClick={() => {
                  setAddError('');
                  setAddForm({ from_city: '', to_city: '', travel_date: '', weight: '', price: '', type: 'travel' });
                  setShowAddJourney(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/40 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Post Journey as Admin
              </button>
            </div>

            {/* global action result banner */}
            {actionResult && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                actionResult.startsWith('✅') ? 'bg-green-500/20 text-green-700 border border-green-400/30' : 'bg-red-500/20 text-red-700 border border-red-400/30'
              }`}>
                <span>{actionResult}</span>
                <button onClick={() => setActionResult(null)} className="text-slate-600 hover:text-slate-900 ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-500 cursor-pointer"
                          checked={filteredUsers.length > 0 && selectedEmails.size === new Set(filteredUsers.map((t: any) => t.email).filter(Boolean)).size}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                      <SortTh field="route"  label="Route" />
                      <SortTh field="date"   label="Travel Date" />
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Weight</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Price</th>
                      <SortTh field="status" label="Status" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJourneys.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-600">No journeys found</td>
                      </tr>
                    ) : (
                      sortedJourneys.map((trip: any, i: number) => {
                        const travelMs  = trip.travel_date ? new Date(trip.travel_date).getTime() : null;
                        const isActive  = trip.status === 'active' && (!travelMs || travelMs >= Date.now());
                        const isPast    = ['expired', 'cancelled', 'inactive', 'completed'].includes(trip.status) ||
                                          (trip.status === 'active' && !!travelMs && travelMs < Date.now());
                        const isTraveller = trip.type === 'travel' || trip.type === 'traveller';
                        const isChecked   = !!trip.email && selectedEmails.has(trip.email);

                        return (
                          <tr
                            key={trip.id || i}
                            onClick={() => router.push(`/admin/journeys/${trip.id}`)}
                            className={`border-b transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-500/10 border-slate-200'
                                : isActive
                                ? 'bg-green-500/5 hover:bg-green-500/10 border-l-2 border-l-green-500 border-b-white/5'
                                : isPast
                                ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500/40 border-b-white/5'
                                : 'hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-500 cursor-pointer"
                                checked={isChecked}
                                onChange={() => trip.email && toggleEmailSelect(trip.email)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-sm truncate max-w-48">{trip.email || '—'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isTraveller ? 'bg-blue-500/20 text-blue-700' : 'bg-purple-500/20 text-purple-700'}`}>
                                {isTraveller ? '✈️ Traveller' : '📦 Sender'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-slate-900 font-medium text-sm">
                                <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                                {trip.from_city} → {trip.to_city}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 text-sm">{fmt(trip.travel_date)}</td>
                            <td className="px-6 py-4 text-slate-700 text-sm">{trip.weight ? `${trip.weight} kg` : '—'}</td>
                            <td className="px-6 py-4 text-slate-900 font-semibold text-sm">
                              {trip.price ? `£${Number(trip.price).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  isActive                        ? 'bg-green-500/20 text-green-700'  :
                                  trip.status === 'matched'       ? 'bg-blue-500/20 text-blue-700'    :
                                  trip.status === 'in_transit'    ? 'bg-cyan-500/20 text-cyan-700'    :
                                  isPast                          ? 'bg-red-500/20 text-red-700'       :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {trip.status || 'unknown'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MATCHES TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600">No matches found</p>
              </div>
            ) : (
              filteredMatches.map(match => (
                <div key={match.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-100 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-900" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold text-lg flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          {match.sender_trip?.from_city} → {match.sender_trip?.to_city}
                        </p>
                        <p className="text-slate-600 text-sm">Match ID: {match.id?.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      match.status === 'completed'                                    ? 'bg-green-500/20 text-green-700 border-green-400/30' :
                      match.status === 'accepted' || match.status === 'in_transit'   ? 'bg-blue-500/20 text-blue-700 border-blue-400/30' :
                      match.status === 'pending'                                     ? 'bg-yellow-500/20 text-yellow-700 border-yellow-400/30' :
                      'bg-red-500/20 text-red-700 border-red-400/30'
                    }`}>
                      {match.status}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm mb-4 bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-slate-600 text-xs">Sender (Hooper)</p>
                        <p className="text-slate-900 font-medium">{match.hooper_email || match.sender_email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-slate-600 text-xs">Traveller (Booter)</p>
                        <p className="text-slate-900 font-medium">{match.booter_email || match.traveler_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-5 gap-4 text-sm mb-4">
                    <div><p className="text-slate-600 mb-1">Payment</p><p className="text-slate-900 font-medium">{match.payment_status || 'N/A'}</p></div>
                    <div><p className="text-slate-600 mb-1">Amount</p><p className="text-slate-900 font-medium">£{Number(match.agreed_price || 0).toFixed(2)}</p></div>
                    <div><p className="text-slate-600 mb-1">Travel Date</p><p className="text-slate-900 font-medium">{fmt(match.sender_trip?.travel_date)}</p></div>
                    <div><p className="text-slate-600 mb-1">Created</p><p className="text-slate-900 font-medium">{fmt(match.created_at)}</p></div>
                    <div>
                      <p className="text-slate-600 mb-1">Confirmations</p>
                      {match.booter_confirmed_delivery && match.hooper_confirmed_receipt ? (
                        <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle className="w-4 h-4" />Both</span>
                      ) : (
                        <span className="text-yellow-600 text-sm">Pending</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/matches/${match.id}`} className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all">
                    <Eye className="w-5 h-5" /> View Full Details
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ESCROW TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'escrow' && (
          <div className="space-y-4">
            {escrowPayments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <DollarSign className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Payments in Escrow</h3>
                <p className="text-slate-600">All payments have been released or no payments are pending</p>
              </div>
            ) : (
              escrowPayments.map(payment => (
                <div key={payment.id} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-slate-900 font-bold text-2xl mb-1">£{Number(payment.agreed_price).toFixed(2)}</p>
                      <p className="text-slate-600 text-sm">Match ID: {payment.id?.slice(0, 12)}...</p>
                    </div>
                    <div className="px-5 py-3 bg-yellow-500/20 text-yellow-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-yellow-400/30">
                      <Shield className="w-5 h-5" /> Escrowed
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {[
                      { key: 'booter', label: 'Traveler (Booter)', confirmed: payment.booter_confirmed_delivery, at: payment.booter_confirmed_at, subLabel: 'Delivery confirmation' },
                      { key: 'hooper', label: 'Sender (Hooper)',   confirmed: payment.hooper_confirmed_receipt, at: payment.hooper_confirmed_at, subLabel: 'Receipt confirmation' },
                    ].map(side => (
                      <div key={side.key} className={`p-4 rounded-xl border-2 ${side.confirmed ? 'bg-green-500/10 border-green-400/50' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          {side.confirmed ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Clock className="w-6 h-6 text-yellow-600" />}
                          <div>
                            <p className="font-semibold text-slate-900">{side.label}</p>
                            <p className="text-xs text-slate-600">{side.subLabel}</p>
                          </div>
                        </div>
                        {side.confirmed ? (
                          <div className="text-sm">
                            <p className="text-green-600 font-medium">✅ Confirmed</p>
                            <p className="text-slate-600 text-xs mt-1">{new Date(side.at).toLocaleString()}</p>
                          </div>
                        ) : (
                          <p className="text-yellow-600 text-sm">⏳ Awaiting confirmation</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" />Payment Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Agreed Price',    val: `£${Number(payment.agreed_price || 0).toFixed(2)}`,    color: 'text-slate-900' },
                        { label: 'Hooper Pays',     val: `£${Number(payment.hooper_pays || 0).toFixed(2)}`,     color: 'text-blue-600' },
                        { label: 'Booter Receives', val: `£${Number(payment.booter_receives || 0).toFixed(2)}`, color: 'text-green-600' },
                        { label: 'Platform Fee',    val: `£${(Number(payment.hooper_pays || 0) - Number(payment.booter_receives || 0)).toFixed(2)}`, color: 'text-purple-600', border: true },
                      ].map(r => (
                        <div key={r.label} className={`flex justify-between ${r.border ? 'border-t border-slate-200 pt-2' : ''}`}>
                          <span className="text-slate-600">{r.label}:</span>
                          <span className={`${r.color} font-semibold`}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <p className="text-orange-700/80 text-sm">Manual release bypasses dual-confirmation. Use only in exceptional, investigated cases.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/matches/${payment.id}`} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                      <Eye className="w-5 h-5" /> View Match
                    </Link>
                    <button onClick={() => releaseEscrow(payment.id)} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5" /> Manual Release
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            DISPUTES TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'disputes' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {disputes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Disputes</h3>
                <p className="text-slate-600">No disputes have been reported yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Dispute</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Match ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Raised</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map(dispute => (
                      <tr key={dispute.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-medium">{dispute.reason || 'No reason given'}</p>
                          <p className="text-slate-600 text-xs mt-0.5">ID: {dispute.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm font-mono">{dispute.match_id?.slice(0, 12)}...</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{fmt(dispute.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            dispute.status === 'resolved'                                ? 'bg-green-500/20 text-green-700' :
                            dispute.status === 'open' || dispute.status === 'pending'   ? 'bg-red-500/20 text-red-700' :
                            'bg-yellow-500/20 text-yellow-700'
                          }`}>
                            {dispute.status || 'open'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/matches/${dispute.match_id}`} className="px-4 py-2 bg-blue-600/80 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-1 w-fit">
                            <Eye className="w-4 h-4" /> View Match
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

      </div>{/* end max-w-7xl */}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD JOURNEY MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddJourney(false)} />
          <div className="relative w-full max-w-lg bg-white border border-green-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Post Admin Journey</h3>
                <p className="text-slate-600 text-xs">As Künle A Aluko · Auto-verified · Goes active immediately</p>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              {/* type toggle */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Journey Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'travel', label: '✈️ Traveller', sub: 'I am travelling' },
                    { value: 'sender', label: '📦 Sender',    sub: 'I need delivery' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, type: opt.value }))}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${addForm.type === opt.value ? 'border-green-400 bg-green-500/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <div className="text-slate-900 font-semibold text-sm">{opt.label}</div>
                      <div className="text-slate-600 text-xs">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* route */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">From City <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={addForm.from_city}
                    onChange={e => setAddForm(f => ({ ...f, from_city: e.target.value }))}
                    placeholder="e.g. London"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">To City <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={addForm.to_city}
                    onChange={e => setAddForm(f => ({ ...f, to_city: e.target.value }))}
                    placeholder="e.g. Lagos"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
              </div>

              {/* date */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Travel Date <span className="text-red-600">*</span></label>
                <input
                  type="date"
                  value={addForm.travel_date}
                  onChange={e => setAddForm(f => ({ ...f, travel_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>

              {/* weight & price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={addForm.weight}
                    onChange={e => setAddForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Price (£)</label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 80"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
              </div>

              {/* admin badge */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <Shield className="w-4 h-4 text-green-600 shrink-0" />
                <div className="text-xs">
                  <p className="text-green-700 font-semibold">Posting as Admin</p>
                  <p className="text-green-600/60">Künle A Aluko · titobalo12@gmail.com · Auto-verified · No Stripe required</p>
                </div>
              </div>

              {addError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-700 text-sm">{addError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAddJourney(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAddJourney}
                  disabled={addBusy || !addForm.from_city || !addForm.to_city || !addForm.travel_date}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addBusy ? 'Posting...' : 'Post Journey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HELP PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative w-full max-w-sm h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-slate-900 font-bold text-lg">Help &amp; Reference</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <section>
                <h3 className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">Journey Tab</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { icon: '🟢', label: 'Active journeys', desc: 'Pinned to the top with a green pulse. These are live and accepting matches.' },
                    { icon: '🔴', label: 'Past journeys',   desc: 'Expired, completed, or cancelled — shown below active, tinted red.' },
                    { icon: '▲▼', label: 'Sort headers',    desc: 'Click Route, Travel Date, or Status column headers to sort. Click again to reverse.' },
                    { icon: '📋', label: 'Row click',       desc: 'Click any row to open the full detail drawer — all fields, match history, and action buttons.' },
                    { icon: '✏️', label: 'Update',          desc: 'Change status, weight, price, or travel date. A reason is always required.' },
                    { icon: '🗑️', label: 'Cancel Journey',  desc: 'Cancels the trip, cancels linked matches, and emails all affected parties. Reason is mandatory.' },
                    { icon: '➕', label: 'Post as Admin',   desc: 'Post a journey as Künle A Aluko. Auto-verified, goes active instantly.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <span className="shrink-0 w-8 text-center text-base">{item.icon}</span>
                      <div>
                        <p className="text-slate-900 font-semibold">{item.label}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <div className="border-t border-slate-200" />
              <section>
                <h3 className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">Other Tabs</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { icon: '🔗', label: 'Matches',  desc: 'All sender-traveller connections. Click View Full Details to see the match page.' },
                    { icon: '🔒', label: 'Escrow',   desc: 'Payments held pending dual confirmation. Manual Release bypasses this — use with caution.' },
                    { icon: '⚠️', label: 'Disputes', desc: 'Issues raised by users. Click View Match to investigate.' },
                    { icon: '⚡', label: 'Near-Miss', desc: 'Finds senders and travellers with same route but dates 1–2 days apart. Emails them asking for flexibility.' },
                    { icon: '✉️', label: 'Compose',  desc: 'Select users via checkboxes in Journeys tab, then use the compose bar at the bottom.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <span className="shrink-0 w-8 text-center text-base">{item.icon}</span>
                      <div>
                        <p className="text-slate-900 font-semibold">{item.label}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <div className="border-t border-slate-200" />
              <section className="pb-6">
                <h3 className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">Support</h3>
                <p className="text-slate-600 text-sm">For platform issues email <span className="text-blue-600">info@boothop.com</span></p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STICKY SELECTION BAR
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedEmails.size > 0 && !showCompose && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-blue-50 backdrop-blur-xl border-t border-blue-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{selectedEmails.size}</div>
              <span className="text-slate-900 font-medium">{selectedEmails.size} customer{selectedEmails.size !== 1 ? 's' : ''} selected</span>
              <button onClick={() => setSelectedEmails(new Set())} className="text-slate-600 hover:text-slate-900 text-xs underline">Clear</button>
            </div>
            <button onClick={openCompose} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all">
              <MessageSquare className="w-5 h-5" /> Compose Message
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          COMPOSE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-lg">Compose Message</h3>
                  <p className="text-slate-600 text-xs">{selectedEmails.size} recipient{selectedEmails.size !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Template</label>
                <div className="relative">
                  <select
                    value={composeTemplate}
                    onChange={e => applyTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer pr-10"
                  >
                    <option value="thankyou">Thank You for Using BootHop</option>
                    <option value="matching">We&apos;re Improving Matching</option>
                    <option value="nomatch">Still Looking for Your Match</option>
                    <option value="promotion">Exciting News Coming Soon</option>
                    <option value="custom">Custom Message</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">Message</label>
                <textarea
                  rows={8}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono text-sm leading-relaxed"
                />
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-slate-600 text-xs mb-1.5 font-semibold uppercase tracking-wide">Sending to</p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {Array.from(selectedEmails).slice(0, 5).join(', ')}
                  {selectedEmails.size > 5 && <span className="text-slate-600"> +{selectedEmails.size - 5} more</span>}
                </p>
              </div>
              {composeResult && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  composeResult.startsWith('✅') ? 'bg-green-500/20 text-green-700 border border-green-400/30' : 'bg-red-500/20 text-red-700 border border-red-400/30'
                }`}>
                  {composeResult}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCompose(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={composeSending || !composeSubject.trim() || !composeBody.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {composeSending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
