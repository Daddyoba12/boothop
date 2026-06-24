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
  Plus, Trash2, Edit2,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtLong(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

  const [selectedTrip, setSelectedTrip]   = useState<any>(null);
  const [tripDetail, setTripDetail]       = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionResult, setActionResult]   = useState<string | null>(null);

  const [showAddJourney, setShowAddJourney] = useState(false);
  const [addForm, setAddForm] = useState({
    from_city: '', to_city: '', travel_date: '', weight: '', price: '', type: 'travel',
  });
  const [addBusy, setAddBusy]   = useState(false);
  const [addError, setAddError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason]       = useState('');
  const [deleteBusy, setDeleteBusy]           = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateField, setUpdateField]         = useState('status');
  const [updateValue, setUpdateValue]         = useState('');
  const [updateReason, setUpdateReason]       = useState('');
  const [updateBusy, setUpdateBusy]           = useState(false);

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

  const openTripDetail = async (trip: any) => {
    setSelectedTrip(trip);
    setTripDetail(null);
    setDetailLoading(true);
    setActionResult(null);
    try {
      const res  = await fetch(`/api/admin/journeys/${trip.id}/detail`);
      const data = await res.json();
      setTripDetail(data);
    } catch {}
    setDetailLoading(false);
  };

  const closeTripDrawer = () => {
    setSelectedTrip(null);
    setActionResult(null);
  };

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

  const handleDeleteTrip = async () => {
    if (!selectedTrip || deleteReason.trim().length < 10) return;
    setDeleteBusy(true);
    try {
      const res  = await fetch(`/api/admin/journeys/${selectedTrip.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowDeleteModal(false);
      setDeleteReason('');
      setSelectedTrip(null);
      setActionResult(`✅ Journey cancelled. ${data.notified} parties notified.`);
      loadDashboardData();
    } catch (err: any) {
      setShowDeleteModal(false);
      setActionResult(`❌ ${err.message}`);
    }
    setDeleteBusy(false);
  };

  const handleUpdateTrip = async () => {
    if (!selectedTrip || !updateValue || updateReason.trim().length < 10) return;
    setUpdateBusy(true);
    try {
      const res  = await fetch(`/api/admin/journeys/${selectedTrip.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: updateField, value: updateValue, reason: updateReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowUpdateModal(false);
      setUpdateReason('');
      setUpdateValue('');
      setSelectedTrip((prev: any) => prev ? { ...prev, [updateField]: updateValue } : prev);
      setActionResult('✅ Journey updated successfully.');
      loadDashboardData();
    } catch (err: any) {
      setShowUpdateModal(false);
      setActionResult(`❌ ${err.message}`);
    }
    setUpdateBusy(false);
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
      className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:text-blue-300 transition-colors select-none"
      onClick={() => {
        if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('desc'); }
      }}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className={`text-xs ${sortField === field ? 'text-blue-400' : 'text-white/20'}`}>
          {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );

  // ── loading screen ────────────────────────────────────────────────────────

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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-xl border-b border-red-400/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0" title="Go back">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl items-center justify-center shrink-0">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base md:text-xl leading-tight truncate">Admin Control Centre</h1>
              <div className="hidden md:flex items-center gap-1 text-white/40 text-xs">
                <Link href="/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">Admin</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Link href="/admin/hub"      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Hub</Link>
            <Link href="/admin/customs"  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Customs</Link>
            <Link href="/admin/business" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all text-xs font-semibold">Business</Link>
            <button onClick={loadDashboardData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Refresh">
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2 bg-blue-600/40 hover:bg-blue-600/70 rounded-xl transition-all" title="Help">
              <HelpCircle className="w-4 h-4 text-blue-300" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-semibold text-xs">
              Exit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── STATS GRID ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Journeys', value: stats.totalUsers,      sub: `${stats.verifiedUsers} KYC verified`,         icon: Users,      from: 'from-blue-500',   to: 'to-cyan-500',   accent: 'text-green-400',  iconRight: TrendingUp },
            { label: 'Active Matches', value: stats.activeMatches,   sub: `${stats.completedMatches} completed`,          icon: Package,    from: 'from-green-500',  to: 'to-emerald-500', accent: 'text-blue-400', iconRight: Activity },
            { label: 'In Escrow',      value: `£${stats.escrowAmount.toFixed(2)}`,  sub: `£${stats.releasedAmount.toFixed(2)} released`, icon: DollarSign, from: 'from-yellow-500', to: 'to-orange-500', accent: 'text-yellow-400', iconRight: Shield },
            { label: 'Platform Revenue', value: `£${stats.platformRevenue.toFixed(2)}`, sub: 'From fees',               icon: TrendingUp, from: 'from-purple-500', to: 'to-pink-500',   accent: 'text-green-400',  iconRight: CheckCircle },
          ].map(s => {
            const Icon  = s.icon;
            const IconR = s.iconRight;
            return (
              <div key={s.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <IconR className={`w-5 h-5 ${s.accent}`} />
                </div>
                <p className="text-white/60 text-sm mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-white mb-2">{s.value}</p>
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
              nearMissResult.startsWith('⚡') ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
              nearMissResult.startsWith('❌') ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
              'bg-white/10 text-white/60 border border-white/10'
            }`}>
              {nearMissResult}
            </span>
          )}
          <span className="text-white/30 text-xs ml-auto">Auto-runs daily at 10:00 UTC</span>
        </div>

        {/* ── SEARCH & FILTER ───────────────────────────────────────────── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by email, route, city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
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
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'}`}>
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
              <div className="flex items-center gap-5 text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Active — pinned to top
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  Past / Cancelled
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30 inline-block" />
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
            {actionResult && !selectedTrip && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                actionResult.startsWith('✅') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
              }`}>
                <span>{actionResult}</span>
                <button onClick={() => setActionResult(null)} className="text-white/40 hover:text-white ml-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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
                      <SortTh field="route"  label="Route" />
                      <SortTh field="date"   label="Travel Date" />
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Weight</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Price</th>
                      <SortTh field="status" label="Status" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJourneys.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-white/60">No journeys found</td>
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
                                ? 'bg-blue-500/10 border-white/5'
                                : isActive
                                ? 'bg-green-500/5 hover:bg-green-500/10 border-l-2 border-l-green-500 border-b-white/5'
                                : isPast
                                ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500/40 border-b-white/5'
                                : 'hover:bg-white/5 border-white/5'
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
                              <div className="flex items-center gap-2 text-white/80">
                                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-sm truncate max-w-48">{trip.email || '—'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isTraveller ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                {isTraveller ? '✈️ Traveller' : '📦 Sender'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-white font-medium text-sm">
                                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                                {trip.from_city} → {trip.to_city}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white/70 text-sm">{fmt(trip.travel_date)}</td>
                            <td className="px-6 py-4 text-white/80 text-sm">{trip.weight ? `${trip.weight} kg` : '—'}</td>
                            <td className="px-6 py-4 text-white font-semibold text-sm">
                              {trip.price ? `£${Number(trip.price).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  isActive                        ? 'bg-green-500/20 text-green-300'  :
                                  trip.status === 'matched'       ? 'bg-blue-500/20 text-blue-300'    :
                                  trip.status === 'in_transit'    ? 'bg-cyan-500/20 text-cyan-300'    :
                                  isPast                          ? 'bg-red-500/20 text-red-300'       :
                                  'bg-white/10 text-white/60'
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
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No matches found</p>
              </div>
            ) : (
              filteredMatches.map(match => (
                <div key={match.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
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
                        <p className="text-white/60 text-sm">Match ID: {match.id?.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                      match.status === 'completed'                                    ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                      match.status === 'accepted' || match.status === 'in_transit'   ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                      match.status === 'pending'                                     ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
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
                    <div><p className="text-white/60 mb-1">Payment</p><p className="text-white font-medium">{match.payment_status || 'N/A'}</p></div>
                    <div><p className="text-white/60 mb-1">Amount</p><p className="text-white font-medium">£{Number(match.agreed_price || 0).toFixed(2)}</p></div>
                    <div><p className="text-white/60 mb-1">Travel Date</p><p className="text-white font-medium">{fmt(match.sender_trip?.travel_date)}</p></div>
                    <div><p className="text-white/60 mb-1">Created</p><p className="text-white font-medium">{fmt(match.created_at)}</p></div>
                    <div>
                      <p className="text-white/60 mb-1">Confirmations</p>
                      {match.booter_confirmed_delivery && match.hooper_confirmed_receipt ? (
                        <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle className="w-4 h-4" />Both</span>
                      ) : (
                        <span className="text-yellow-400 text-sm">Pending</span>
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
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <DollarSign className="w-20 h-20 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Payments in Escrow</h3>
                <p className="text-white/60">All payments have been released or no payments are pending</p>
              </div>
            ) : (
              escrowPayments.map(payment => (
                <div key={payment.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white font-bold text-2xl mb-1">£{Number(payment.agreed_price).toFixed(2)}</p>
                      <p className="text-white/60 text-sm">Match ID: {payment.id?.slice(0, 12)}...</p>
                    </div>
                    <div className="px-5 py-3 bg-yellow-500/20 text-yellow-300 rounded-xl text-sm font-bold flex items-center gap-2 border border-yellow-400/30">
                      <Shield className="w-5 h-5" /> Escrowed
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {[
                      { key: 'booter', label: 'Traveler (Booter)', confirmed: payment.booter_confirmed_delivery, at: payment.booter_confirmed_at, subLabel: 'Delivery confirmation' },
                      { key: 'hooper', label: 'Sender (Hooper)',   confirmed: payment.hooper_confirmed_receipt, at: payment.hooper_confirmed_at, subLabel: 'Receipt confirmation' },
                    ].map(side => (
                      <div key={side.key} className={`p-4 rounded-xl border-2 ${side.confirmed ? 'bg-green-500/10 border-green-400/50' : 'bg-white/5 border-white/20'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          {side.confirmed ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Clock className="w-6 h-6 text-yellow-400" />}
                          <div>
                            <p className="font-semibold text-white">{side.label}</p>
                            <p className="text-xs text-white/60">{side.subLabel}</p>
                          </div>
                        </div>
                        {side.confirmed ? (
                          <div className="text-sm">
                            <p className="text-green-400 font-medium">✅ Confirmed</p>
                            <p className="text-white/60 text-xs mt-1">{new Date(side.at).toLocaleString()}</p>
                          </div>
                        ) : (
                          <p className="text-yellow-400 text-sm">⏳ Awaiting confirmation</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" />Payment Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Agreed Price',    val: `£${Number(payment.agreed_price || 0).toFixed(2)}`,    color: 'text-white' },
                        { label: 'Hooper Pays',     val: `£${Number(payment.hooper_pays || 0).toFixed(2)}`,     color: 'text-blue-400' },
                        { label: 'Booter Receives', val: `£${Number(payment.booter_receives || 0).toFixed(2)}`, color: 'text-green-400' },
                        { label: 'Platform Fee',    val: `£${(Number(payment.hooper_pays || 0) - Number(payment.booter_receives || 0)).toFixed(2)}`, color: 'text-purple-400', border: true },
                      ].map(r => (
                        <div key={r.label} className={`flex justify-between ${r.border ? 'border-t border-white/10 pt-2' : ''}`}>
                          <span className="text-white/60">{r.label}:</span>
                          <span className={`${r.color} font-semibold`}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-orange-300/80 text-sm">Manual release bypasses dual-confirmation. Use only in exceptional, investigated cases.</p>
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
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {disputes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Disputes</h3>
                <p className="text-white/60">No disputes have been reported yet.</p>
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
                    {disputes.map(dispute => (
                      <tr key={dispute.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{dispute.reason || 'No reason given'}</p>
                          <p className="text-white/50 text-xs mt-0.5">ID: {dispute.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4 text-white/70 text-sm font-mono">{dispute.match_id?.slice(0, 12)}...</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{fmt(dispute.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            dispute.status === 'resolved'                                ? 'bg-green-500/20 text-green-300' :
                            dispute.status === 'open' || dispute.status === 'pending'   ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
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
          JOURNEY DETAIL DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedTrip && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTripDrawer} />
          <div className="relative w-full max-w-lg h-full bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl flex flex-col">

            {/* drawer header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedTrip.status === 'active'                                          ? 'bg-green-400 animate-pulse' :
                  ['expired', 'cancelled', 'inactive'].includes(selectedTrip.status)        ? 'bg-red-400' :
                  'bg-blue-400'
                }`} />
                <div className="min-w-0">
                  <h2 className="text-white font-bold text-base truncate">{selectedTrip.from_city} → {selectedTrip.to_city}</h2>
                  <p className="text-white/50 text-xs truncate">{selectedTrip.email}</p>
                </div>
              </div>
              <button onClick={closeTripDrawer} className="p-1.5 hover:bg-white/10 rounded-lg transition-all shrink-0">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* action result inside drawer */}
              {actionResult && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                  actionResult.startsWith('✅') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                }`}>
                  <span>{actionResult}</span>
                  <button onClick={() => setActionResult(null)} className="text-white/40 hover:text-white ml-2"><X className="w-4 h-4" /></button>
                </div>
              )}

              {/* journey details */}
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Journey Details</h3>
                <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
                  {[
                    { label: 'Email',       value: selectedTrip.email || '—' },
                    { label: 'Type',        value: (selectedTrip.type === 'travel' || selectedTrip.type === 'traveller') ? '✈️ Traveller' : '📦 Sender' },
                    { label: 'From',        value: selectedTrip.from_city || '—' },
                    { label: 'To',          value: selectedTrip.to_city   || '—' },
                    { label: 'Travel Date', value: fmt(selectedTrip.travel_date) },
                    { label: 'Weight',      value: selectedTrip.weight ? `${selectedTrip.weight} kg` : '—' },
                    { label: 'Price',       value: selectedTrip.price  ? `£${Number(selectedTrip.price).toFixed(2)}` : '—' },
                    { label: 'Status',      value: selectedTrip.status || 'unknown' },
                    { label: 'Created',     value: fmtLong(selectedTrip.created_at) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-white/50 text-sm">{row.label}</span>
                      <span className="text-white text-sm font-medium text-right max-w-[260px]">{row.value}</span>
                    </div>
                  ))}
                  {/* any extra fields from select('*') */}
                  {tripDetail?.trip && Object.entries(tripDetail.trip)
                    .filter(([k]) => !['id','email','from_city','to_city','travel_date','weight','price','status','created_at','type','updated_at'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-4 py-3">
                        <span className="text-white/40 text-sm capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-white/70 text-sm text-right max-w-[260px] truncate">{String(v ?? '—')}</span>
                      </div>
                    ))
                  }
                </div>
              </section>

              {/* match history */}
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Match History</h3>
                {detailLoading ? (
                  <div className="text-center py-8 text-white/40 text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading matches...
                  </div>
                ) : tripDetail?.matches?.length > 0 ? (
                  <div className="space-y-3">
                    {tripDetail.matches.map((m: any) => (
                      <div key={m.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            m.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            m.status === 'cancelled' ? 'bg-red-500/20 text-red-300'    :
                            'bg-blue-500/20 text-blue-300'
                          }`}>{m.status}</span>
                          <span className="text-white/40 text-xs">{fmt(m.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white font-semibold">£{Number(m.agreed_price || 0).toFixed(2)}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            m.payment_status === 'released' ? 'bg-green-500/20 text-green-300' :
                            m.payment_status === 'escrowed' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-white/10 text-white/50'
                          }`}>{m.payment_status || 'pending'}</span>
                        </div>
                        {m.id && (
                          <Link href={`/matches/${m.id}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View full match
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <Package className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">No matches for this journey yet</p>
                  </div>
                )}
              </section>

            </div>

            {/* sticky action bar */}
            {selectedTrip.status !== 'cancelled' && (
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex gap-3">
                <button
                  onClick={() => { setUpdateField('status'); setUpdateValue(''); setUpdateReason(''); setShowUpdateModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all text-sm"
                >
                  <Edit2 className="w-4 h-4" /> Update
                </button>
                <button
                  onClick={() => { setDeleteReason(''); setShowDeleteModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-semibold transition-all text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Cancel Journey
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-red-950/60 border border-red-400/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Cancel Journey</h3>
                <p className="text-white/50 text-xs">{selectedTrip.from_city} → {selectedTrip.to_city}</p>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-200 text-sm leading-relaxed">
                  This will cancel the journey, cancel any linked active matches, and send notification emails to all involved parties. <strong className="text-red-300">This cannot be undone.</strong>
                </p>
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">
                  Reason for Cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Enter the reason (sent to all affected parties)..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm leading-relaxed"
                />
                <p className={`text-xs mt-1.5 ${deleteReason.trim().length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {deleteReason.trim().length} / 10 minimum characters
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                  Back
                </button>
                <button
                  onClick={handleDeleteTrip}
                  disabled={deleteReason.trim().length < 10 || deleteBusy}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteBusy ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          UPDATE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showUpdateModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpdateModal(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-blue-950/60 border border-blue-400/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Update Journey</h3>
                <p className="text-white/50 text-xs">{selectedTrip.from_city} → {selectedTrip.to_city}</p>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Field to Update</label>
                <select
                  value={updateField}
                  onChange={e => { setUpdateField(e.target.value); setUpdateValue(''); }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                >
                  <option value="status">Status</option>
                  <option value="weight">Weight (kg)</option>
                  <option value="price">Price (£)</option>
                  <option value="travel_date">Travel Date</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">New Value</label>
                {updateField === 'status' ? (
                  <select
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                  >
                    <option value="">Select new status...</option>
                    <option value="active">Active</option>
                    <option value="matched">Matched</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : updateField === 'travel_date' ? (
                  <input
                    type="date"
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <input
                    type="number"
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    placeholder={updateField === 'weight' ? 'e.g. 10' : 'e.g. 80'}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">
                  Reason for Update <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={updateReason}
                  onChange={e => setUpdateReason(e.target.value)}
                  placeholder="Why is this field being changed?..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
                />
                <p className={`text-xs mt-1.5 ${updateReason.trim().length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {updateReason.trim().length} / 10 minimum characters
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowUpdateModal(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTrip}
                  disabled={!updateValue || updateReason.trim().length < 10 || updateBusy}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {updateBusy ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD JOURNEY MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddJourney(false)} />
          <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 to-green-950/50 border border-green-400/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Post Admin Journey</h3>
                <p className="text-white/50 text-xs">As Künle A Aluko · Auto-verified · Goes active immediately</p>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              {/* type toggle */}
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Journey Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'travel', label: '✈️ Traveller', sub: 'I am travelling' },
                    { value: 'sender', label: '📦 Sender',    sub: 'I need delivery' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, type: opt.value }))}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${addForm.type === opt.value ? 'border-green-400 bg-green-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="text-white font-semibold text-sm">{opt.label}</div>
                      <div className="text-white/50 text-xs">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* route */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">From City <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={addForm.from_city}
                    onChange={e => setAddForm(f => ({ ...f, from_city: e.target.value }))}
                    placeholder="e.g. London"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">To City <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={addForm.to_city}
                    onChange={e => setAddForm(f => ({ ...f, to_city: e.target.value }))}
                    placeholder="e.g. Lagos"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
              </div>

              {/* date */}
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Travel Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={addForm.travel_date}
                  onChange={e => setAddForm(f => ({ ...f, travel_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>

              {/* weight & price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={addForm.weight}
                    onChange={e => setAddForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Price (£)</label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 80"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
              </div>

              {/* admin badge */}
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <Shield className="w-4 h-4 text-green-400 shrink-0" />
                <div className="text-xs">
                  <p className="text-green-300 font-semibold">Posting as Admin</p>
                  <p className="text-green-400/60">Künle A Aluko · titobalo12@gmail.com · Auto-verified · No Stripe required</p>
                </div>
              </div>

              {addError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">{addError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAddJourney(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
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
          <div className="relative w-full max-w-sm h-full bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl overflow-y-auto">
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
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Journey Tab</h3>
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
                        <p className="text-white font-semibold">{item.label}</p>
                        <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <div className="border-t border-white/10" />
              <section>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Other Tabs</h3>
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
                        <p className="text-white font-semibold">{item.label}</p>
                        <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <div className="border-t border-white/10" />
              <section className="pb-6">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Support</h3>
                <p className="text-white/60 text-sm">For platform issues email <span className="text-blue-400">info@boothop.com</span></p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STICKY SELECTION BAR
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedEmails.size > 0 && !showCompose && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-t border-blue-400/30 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{selectedEmails.size}</div>
              <span className="text-white font-medium">{selectedEmails.size} customer{selectedEmails.size !== 1 ? 's' : ''} selected</span>
              <button onClick={() => setSelectedEmails(new Set())} className="text-white/50 hover:text-white text-xs underline">Clear</button>
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
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-blue-950 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
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
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-white/50 text-xs mb-1.5 font-semibold uppercase tracking-wide">Sending to</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {Array.from(selectedEmails).slice(0, 5).join(', ')}
                  {selectedEmails.size > 5 && <span className="text-white/40"> +{selectedEmails.size - 5} more</span>}
                </p>
              </div>
              {composeResult && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  composeResult.startsWith('✅') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                }`}>
                  {composeResult}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCompose(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
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
