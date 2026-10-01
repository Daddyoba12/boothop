'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type View = 'login' | 'register' | 'reset';

/* ── Shared shell styles ─────────────────────────────────────────────────── */
const S = {
  shell:  'min-h-screen flex flex-col items-center justify-center px-5 py-10',
  card:   'w-full rounded-2xl border p-8 shadow-2xl',
  label:  'block text-[12px] font-semibold uppercase tracking-wide mb-1.5',
  helper: 'mt-1.5 text-[11px] leading-relaxed',
  input:  'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none focus:ring-2',
  btn:    'w-full py-3.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60',
  err:    'text-sm rounded-lg px-4 py-3 border',
  ok:     'text-sm rounded-lg px-4 py-3 border',
  link:   'font-semibold transition-colors',
};

/* ── Shared icon components ─────────────────────────────────────────────── */
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function UserPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

/* ── Branded shell wrapper ───────────────────────────────────────────────── */
function AuthShell({ children }: {
  children: React.ReactNode;
  view: View;
  onSwitch: (v: View) => void;
}) {
  return (
    <div className={S.shell} style={{ background: '#ffffff' }}>
      {/* Back to main site */}
      <div className="absolute top-5 left-6">
        <Link href="/" className="text-sm font-medium transition-colors"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#334155')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
          ← BootHop.com
        </Link>
      </div>

      <div className="w-full" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/images/boothopimage-transparent.png"
            alt="BootHop"
            style={{ height: 72, width: 'auto', objectFit: 'contain', display: 'block' }}
            draggable={false}
          />
          <div className="mt-3 flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' }}>Pipeline</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff6a00' }}>Commander</span>
          </div>
        </div>

        {/* Card */}
        <div className={S.card} style={{ background: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
          {children}
        </div>

        {/* Footer link */}
        <p className="mt-5 text-center text-xs" style={{ color: '#94a3b8' }}>
          Need help?{' '}
          <a href="mailto:info@boothop.com" className={S.link}
            style={{ color: '#64748b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#334155')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Reusable field ──────────────────────────────────────────────────────── */
function Field({ label: lbl, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={S.label} style={{ color: '#64748b' }}>{lbl}</label>
      {children}
      {helper && <p className={S.helper} style={{ color: '#94a3b8' }}>{helper}</p>}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={S.input}
      style={{
        background: '#ffffff',
        borderColor: '#e2e8f0',
        color: '#0f172a',
        caretColor: '#ff6a00',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#ff6a00'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,106,0,0.12)'; }}
      onBlur={e =>  { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={S.input + ' appearance-none cursor-pointer'}
      style={{
        background: '#ffffff',
        borderColor: '#e2e8f0',
        color: '#0f172a',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#ff6a00'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,106,0,0.12)'; }}
      onBlur={e =>  { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {props.children}
    </select>
  );
}

function PrimaryBtn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading} className={S.btn}
      style={{ background: '#ff6a00', color: '#fff' }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e55a00')}
      onMouseLeave={e => (e.currentTarget.style.background = '#ff6a00')}>
      {loading ? loadingLabel : label}
    </button>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return <p className={S.err} style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }}>{msg}</p>;
}

function OkMsg({ msg }: { msg: string }) {
  return <p className={S.ok} style={{ color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0' }}>{msg}</p>;
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="text-sm transition-colors mt-1"
      style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      onMouseEnter={e => (e.currentTarget.style.color = '#334155')}
      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
      {label}
    </button>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function CommanderPage() {
  const router = useRouter();
  const [view, setView]       = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const [slug, setSlug]         = useState('');
  const [password, setPassword] = useState('');

  const [regCompany,     setRegCompany]     = useState('');
  const [regSlug,        setRegSlug]        = useState('');
  const [regEmail,       setRegEmail]       = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regPassword,    setRegPassword]    = useState('');
  const [regPlan,        setRegPlan]        = useState<'basic' | 'pro'>('basic');

  const [resetSlug,  setResetSlug]  = useState('');
  const [resetEmail, setResetEmail] = useState('');

  function switchView(v: View) { setView(v); setError(''); setSuccess(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/commander/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
    router.push('/commander/dashboard');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/commander/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company:      regCompany.trim(),
        slug:         regSlug.trim().toLowerCase(),
        email:        regEmail.trim(),
        contact_name: regContactName.trim(),
        password:     regPassword,
        plan:         regPlan,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
    router.push('/commander/dashboard');
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    await fetch('/api/commander/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: resetSlug.trim().toLowerCase(), email: resetEmail.trim() }),
    });
    setLoading(false);
    setSuccess('If the details match an account, a reset email is on its way. Check your inbox — the link expires after first use.');
  }

  const divider = <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />;

  return (
    <AuthShell view={view} onSwitch={switchView}>

      {/* ── SIGN IN ── */}
      {view === 'login' && (
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex items-center gap-2.5 mb-6" style={{ color: '#ff6a00' }}>
            <LockIcon />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Welcome back</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Sign in to your Commander workspace.</p>
            </div>
          </div>

          <Field label="Workspace ID" helper="Provided when your Commander account was created.">
            <StyledInput type="text" value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="e.g. ginspired" autoComplete="username" required />
          </Field>
          <Field label="Password">
            <StyledInput type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" autoComplete="current-password" required />
          </Field>

          {error && <ErrMsg msg={error} />}

          <PrimaryBtn loading={loading} label="Sign in →" loadingLabel="Signing in…" />

          <div className="flex flex-col gap-2 pt-1 items-center text-center">
            <BackLink onClick={() => switchView('reset')} label="Forgot your password? Reset it →" />
            {divider}
            <BackLink onClick={() => switchView('register')} label="New to Commander? Create an account →" />
          </div>
        </form>
      )}

      {/* ── CREATE ACCOUNT ── */}
      {view === 'register' && (
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="flex items-center gap-2.5 mb-6" style={{ color: '#ff6a00' }}>
            <UserPlusIcon />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Create your workspace</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Set up your Commander account to get started.</p>
            </div>
          </div>

          <Field label="Company Name">
            <StyledInput type="text" value={regCompany} onChange={e => setRegCompany(e.target.value)}
              placeholder="e.g. Acme Media" autoComplete="organization" required />
          </Field>
          <Field label="Workspace ID" helper="Lowercase letters, numbers and hyphens only. This is your login username.">
            <StyledInput type="text" value={regSlug}
              onChange={e => setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="e.g. acme-media" autoComplete="username" required />
          </Field>
          <Field label="Email">
            <StyledInput type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
              placeholder="you@company.com" autoComplete="email" />
          </Field>
          <Field label="Contact Name">
            <StyledInput type="text" value={regContactName} onChange={e => setRegContactName(e.target.value)}
              placeholder="e.g. John Smith" autoComplete="name" />
          </Field>
          <Field label="Password" helper="Minimum 8 characters.">
            <StyledInput type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
              placeholder="Min 8 characters" autoComplete="new-password" required />
          </Field>
          <Field label="Plan">
            <StyledSelect value={regPlan} onChange={e => setRegPlan(e.target.value as 'basic' | 'pro')}>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </StyledSelect>
          </Field>

          {error && <ErrMsg msg={error} />}

          <PrimaryBtn loading={loading} label="Create Account →" loadingLabel="Creating account…" />

          <div className="flex justify-center pt-1">
            <BackLink onClick={() => switchView('login')} label="← Already have an account? Sign in" />
          </div>
        </form>
      )}

      {/* ── RESET PASSWORD ── */}
      {view === 'reset' && (
        <form onSubmit={handleReset} className="space-y-5">
          <div className="flex items-center gap-2.5 mb-6" style={{ color: '#ff6a00' }}>
            <ShieldIcon />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Reset your password</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                Enter your workspace ID and registered email. We&apos;ll send you a secure reset link.
              </p>
            </div>
          </div>

          <Field label="Workspace ID" helper="Provided when your Commander account was created.">
            <StyledInput type="text" value={resetSlug} onChange={e => setResetSlug(e.target.value)}
              placeholder="e.g. ginspired" autoComplete="username" required />
          </Field>
          <Field label="Email Address">
            <StyledInput type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
              placeholder="you@yourcompany.com" autoComplete="email" required />
          </Field>

          {error   && <ErrMsg msg={error} />}
          {success && <OkMsg msg={success} />}

          {!success && (
            <>
              <PrimaryBtn loading={loading} label="Send Reset Link →" loadingLabel="Sending…" />
              <p className="text-center" style={{ fontSize: 11, color: '#94a3b8' }}>
                For your security, reset links expire after 30 minutes.
              </p>
            </>
          )}

          <div className="flex justify-center pt-1">
            <BackLink onClick={() => switchView('login')} label="← Back to sign in" />
          </div>
        </form>
      )}

    </AuthShell>
  );
}
