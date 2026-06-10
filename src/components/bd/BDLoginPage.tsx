'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BDLoginPage({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [step,    setStep]    = useState<'send' | 'verify'>('send');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  async function sendCode() {
    setLoading(true); setError('');
    const res  = await fetch('/api/bd/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'send' }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSent(true);
    setStep('verify');
  }

  async function verifyCode() {
    setLoading(true); setError('');
    const res  = await fetch('/api/bd/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'verify', code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  '#0D1117',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
      fontFamily:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding:     24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px' }}>
            BootHop BD Pipeline
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
            "How things move around the world"
          </p>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: 32 }}>
          {step === 'send' ? (
            <>
              <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
                A 6-digit access code will be sent to:
              </p>
              <div style={{
                background:   '#1F2937',
                borderRadius: 10,
                color:        '#7C3AED',
                fontWeight:   700,
                fontSize:     15,
                padding:      '12px 16px',
                textAlign:    'center',
                marginBottom: 24,
              }}>
                oluwatoyinb@yahoo.com
              </div>
              <button
                onClick={sendCode}
                disabled={loading}
                style={{
                  background:   loading ? '#374151' : '#7C3AED',
                  border:       'none',
                  borderRadius: 10,
                  color:        '#fff',
                  cursor:       loading ? 'not-allowed' : 'pointer',
                  fontSize:     15,
                  fontWeight:   700,
                  padding:      '14px 0',
                  width:        '100%',
                }}
              >
                {loading ? 'Sending...' : 'Send Code →'}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                Code sent to oluwatoyinb@yahoo.com
              </p>
              <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
                Expires in 15 minutes
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && code.length === 6 && verifyCode()}
                style={{
                  background:   '#1F2937',
                  border:       '2px solid #374151',
                  borderRadius: 10,
                  color:        '#F9FAFB',
                  fontSize:     24,
                  fontWeight:   700,
                  letterSpacing: 8,
                  marginBottom: 16,
                  padding:      '14px 0',
                  textAlign:    'center',
                  width:        '100%',
                }}
                autoFocus
              />
              <button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                style={{
                  background:   (loading || code.length !== 6) ? '#374151' : '#7C3AED',
                  border:       'none',
                  borderRadius: 10,
                  color:        '#fff',
                  cursor:       (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                  fontSize:     15,
                  fontWeight:   700,
                  marginBottom: 12,
                  padding:      '14px 0',
                  width:        '100%',
                }}
              >
                {loading ? 'Verifying...' : 'Access Dashboard →'}
              </button>
              <button
                onClick={() => { setStep('send'); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, width: '100%' }}
              >
                ← Resend code
              </button>
            </>
          )}

          {error && (
            <div style={{ background: '#7F1D1D33', borderRadius: 8, color: '#FCA5A5', fontSize: 13, marginTop: 16, padding: '10px 14px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
