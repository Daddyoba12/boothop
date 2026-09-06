'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Client {
  id:              string;
  slug:            string;
  company:         string;
  email:           string | null;
  contact_name:    string | null;
  plan:            string | null;
  status:          string | null;
  created_at:      string;
  is_super_admin:  boolean;
  oracle_pipeline: string | null;
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#f3f4f8;font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif}
.layout{display:flex;height:100vh;overflow:hidden}
.sidebar{width:220px;flex-shrink:0;background:#111827;display:flex;flex-direction:column;height:100vh;position:sticky;top:0}
.sb-brand{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,0.07)}
.sb-logo{font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:-0.3px}
.sb-logo span{color:#ff6a00}
.sb-tag{font-size:0.6rem;color:#4b5563;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px}
.sb-nav{flex:1;padding:14px 10px}
.sb-section{font-size:0.58rem;color:#374151;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;padding:0 10px;margin-bottom:6px;margin-top:18px}
.sb-section:first-child{margin-top:0}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;font-size:0.83rem;font-weight:500;color:#9ca3af;border:none;background:none;width:100%;text-align:left;transition:all 0.15s;text-decoration:none;cursor:pointer}
.nav-item:hover{background:rgba(255,255,255,0.06);color:#e5e7eb}
.nav-item.active{background:rgba(255,106,0,0.15);color:#ff8533;font-weight:600}
.sb-footer{padding:14px 12px;border-top:1px solid rgba(255,255,255,0.06)}
.sb-user{display:flex;align-items:center;gap:10px}
.sb-avatar{width:30px;height:30px;border-radius:50%;background:#ff6a00;color:#fff;font-size:0.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-uname{font-size:0.78rem;font-weight:600;color:#e5e7eb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-urole{font-size:0.65rem;color:#4b5563;margin-top:1px}
.signout-btn{margin-top:8px;width:100%;padding:7px 10px;border-radius:7px;border:none;background:rgba(255,255,255,0.04);color:#6b7280;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all .15s;text-align:left}
.signout-btn:hover{background:rgba(255,255,255,0.08);color:#9ca3af}
.main{flex:1;overflow-y:auto;background:#f3f4f8}
.topbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:0 28px;height:58px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:10}
.page-body{padding:28px 28px 48px}
.page-head{margin-bottom:24px}
.page-title{font-size:1.4rem;font-weight:800;color:#111827;letter-spacing:-0.4px}
.page-desc{font-size:0.85rem;color:#6b7280;margin-top:4px}
.controls{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.search-wrap{position:relative;flex:1;min-width:200px;max-width:340px}
.search-input{width:100%;padding:9px 12px 9px 36px;border:1px solid #e5e7eb;border-radius:9px;font-size:0.84rem;background:#fff;color:#111827;outline:none;transition:border .15s}
.search-input:focus{border-color:#ff6a00;box-shadow:0 0 0 3px rgba(255,106,0,0.08)}
.search-ico{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none}
.filter-select{padding:8px 12px;border:1px solid #e5e7eb;border-radius:9px;font-size:0.82rem;background:#fff;color:#374151;outline:none;cursor:pointer}
.filter-select:focus{border-color:#ff6a00}
.btn-primary{padding:9px 16px;background:#ff6a00;color:#fff;border:none;border-radius:9px;font-size:0.84rem;font-weight:700;cursor:pointer;transition:background .15s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.btn-primary:hover{background:#e55a00}
.count-chip{font-size:0.75rem;font-weight:700;color:#6b7280;background:#f3f4f8;border:1px solid #e5e7eb;padding:4px 10px;border-radius:20px}
.client-grid{display:flex;flex-direction:column;gap:10px}
.client-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;transition:box-shadow .15s,border-color .15s}
.client-card:hover{box-shadow:0 2px 12px rgba(0,0,0,0.07);border-color:#d1d5db}
.client-avatar{width:42px;height:42px;border-radius:10px;background:#111827;color:#ff6a00;font-size:1rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-transform:uppercase}
.client-name{font-size:0.95rem;font-weight:700;color:#111827}
.client-slug{font-size:0.75rem;color:#9ca3af;font-family:monospace;margin-top:1px}
.client-email{font-size:0.75rem;color:#6b7280;margin-top:2px}
.client-meta{flex:1;min-width:0}
.client-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.badge{font-size:0.68rem;font-weight:700;padding:3px 9px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap}
.badge-active{background:#dcfce7;color:#15803d}
.badge-trial{background:#fef9c3;color:#a16207}
.badge-suspended{background:#fee2e2;color:#b91c1c}
.badge-archived{background:#f3f4f6;color:#6b7280}
.badge-plan-basic{background:#f3f4f6;color:#374151}
.badge-plan-pro{background:#fef3c7;color:#92400e}
.badge-admin{background:#ede9fe;color:#6d28d9}
.client-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.btn-open{padding:7px 14px;background:#ff6a00;color:#fff;border-radius:8px;font-size:0.8rem;font-weight:700;text-decoration:none;transition:background .15s;white-space:nowrap}
.btn-open:hover{background:#e55a00}
.btn-ghost{padding:7px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:0.8rem;font-weight:600;color:#374151;background:#fff;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-ghost:hover{border-color:#d1d5db;background:#f9fafb}
.empty-state{text-align:center;padding:80px 20px}
.empty-state svg{margin:0 auto 20px;display:block;opacity:.35}
.empty-title{font-size:1.1rem;font-weight:700;color:#374151;margin-bottom:8px}
.empty-desc{font-size:0.875rem;color:#9ca3af;max-width:340px;margin:0 auto 24px;line-height:1.6}
`;

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function statusBadge(status: string | null) {
  switch (status) {
    case 'active':    return 'badge badge-active';
    case 'trial':     return 'badge badge-trial';
    case 'suspended': return 'badge badge-suspended';
    case 'archived':  return 'badge badge-archived';
    default:          return 'badge badge-active';
  }
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function AllClientsClient({
  clients,
  adminName,
  adminSlug,
}: {
  clients: Client[];
  adminName: string;
  adminSlug: string;
}) {
  const router = useRouter();
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [planFilter,    setPlanFilter]    = useState('all');
  const [signingOut,    setSigningOut]    = useState(false);

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || c.company.toLowerCase().includes(q)
        || c.slug.toLowerCase().includes(q)
        || (c.email ?? '').toLowerCase().includes(q)
        || (c.contact_name ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (c.status ?? 'active') === statusFilter;
      const matchPlan   = planFilter === 'all'   || (c.plan ?? 'basic') === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [clients, search, statusFilter, planFilter]);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/commander/logout', { method: 'POST' });
    router.push('/commander');
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="layout">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-logo"><span>Boot</span>Hop</div>
            <div className="sb-tag">Commander · Admin</div>
          </div>

          <nav className="sb-nav">
            <div className="sb-section">Control Centre</div>
            <a href="/commander/admin/clients" className="nav-item active">
              <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              All Clients
            </a>
            <a href="/commander/admin/settings" className="nav-item">
              <NavIcon path="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              System Settings
            </a>
          </nav>

          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-avatar">{initials(adminName)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="sb-uname">{adminName}</div>
                <div className="sb-urole">Superadmin</div>
              </div>
            </div>
            <button className="signout-btn" disabled={signingOut} onClick={signOut}>
              {signingOut ? 'Signing out…' : '← Sign out'}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af' }}>
              Superadmin Control Centre
            </div>
            <div style={{ flex: 1 }} />
            <span className="count-chip">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="page-body">
            {/* Page header */}
            <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 className="page-title">All Clients</h1>
                <p className="page-desc">Manage Commander client accounts and open their content workspaces.</p>
              </div>
              <Link href="/commander/register" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Client Account
              </Link>
            </div>

            {/* Controls */}
            <div className="controls">
              <div className="search-wrap">
                <span className="search-ico">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, workspace ID or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>

              <select className="filter-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
                <option value="all">All plans</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            {/* Client list */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                {clients.length === 0 ? (
                  <>
                    <p className="empty-title">No client accounts yet</p>
                    <p className="empty-desc">Create your first Commander client workspace to begin managing content.</p>
                    <Link href="/commander/register" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
                      Create Client Account
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="empty-title">No results</p>
                    <p className="empty-desc">No clients match your current filters. Try clearing the search or adjusting the filters.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="client-grid">
                {filtered.map(c => (
                  <div key={c.id} className="client-card">
                    {/* Avatar */}
                    <div className="client-avatar">
                      {initials(c.company)}
                    </div>

                    {/* Identity */}
                    <div className="client-meta">
                      <div className="client-name">{c.company}</div>
                      <div className="client-slug">{c.slug}</div>
                      {c.email && <div className="client-email">{c.email}</div>}
                    </div>

                    {/* Badges */}
                    <div className="client-badges">
                      <span className={statusBadge(c.status)}>{c.status ?? 'active'}</span>
                      <span className={`badge ${c.plan === 'pro' ? 'badge-plan-pro' : 'badge-plan-basic'}`}>{c.plan ?? 'basic'}</span>
                      {c.is_super_admin && <span className="badge badge-admin">Admin</span>}
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                    </div>

                    {/* Actions */}
                    <div className="client-actions">
                      <Link href={`/commander/pipeline/${c.slug}`} className="btn-open">
                        Open Workspace →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
