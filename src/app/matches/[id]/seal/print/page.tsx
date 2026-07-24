import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/seals/generate';
import { SealQrCode } from './SealQrCode';

export const metadata = { title: 'BootHop SecureSeal' };

interface Params { id: string }
interface SearchParams { t?: string }

export default async function SealPrintPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: matchId }, { t: rawToken }] = await Promise.all([params, searchParams]);

  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) redirect(`/login?next=/matches/${matchId}/seal/print`);

  if (!rawToken) {
    return <ErrorPage message="Missing seal token. Generate a new seal from your match page." />;
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = hashToken(rawToken);

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return <ErrorPage message="Match not found." />;

  if (match.sender_email !== session.email && match.traveler_email !== session.email) {
    return <ErrorPage message="Access denied." />;
  }

  const { data: seal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, status, generated_at, expires_at')
    .eq('match_id', matchId)
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!seal) {
    return <ErrorPage message="Seal not found or the link has expired. Generate a new seal from your match page." />;
  }
  if (seal.status === 'revoked') {
    return <ErrorPage message="This seal has been revoked and is no longer valid." />;
  }
  if (seal.status === 'expired' || new Date(seal.expires_at) < new Date()) {
    return <ErrorPage message="This seal has expired. Generate a new seal from your match page." />;
  }

  const trip = Array.isArray(match.sender_trip)
    ? (match.sender_trip as { from_city: string; to_city: string; travel_date: string }[])[0]
    : (match.sender_trip as { from_city: string; to_city: string; travel_date: string } | null);

  const fromCity = trip?.from_city ?? '—';
  const toCity   = trip?.to_city   ?? '—';

  const generatedDate = new Date(seal.generated_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const expiresDate = new Date(seal.expires_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Mask email: show first 3 chars + *** + @domain
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 3)}***@${domain}`;
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .seal-card { box-shadow: none !important; border: 2px solid #000 !important; }
        }
        @media screen {
          body { background: #f1f5f9; }
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <span className="text-sm font-medium text-slate-600">BootHop SecureSeal — Print Preview</span>
        <button
          onClick={() => typeof window !== 'undefined' && window.print()}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Printable label */}
      <div className="flex items-center justify-center min-h-screen p-8 print:p-0 print:min-h-0">
        <div
          className="seal-card bg-white border border-slate-300 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Header */}
          <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '20px', letterSpacing: '0.05em' }}>BOOTHOP</div>
              <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>SecureSeal™</div>
            </div>
            <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'right' }}>
              <div>CHAIN OF CUSTODY</div>
              <div>SHIPMENT SEAL</div>
            </div>
          </div>

          {/* Seal number banner */}
          <div style={{ background: '#1e293b', padding: '12px 24px', textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Seal Number</div>
            <div style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: '28px', fontWeight: 800, letterSpacing: '0.1em' }}>{seal.seal_number}</div>
          </div>

          {/* QR + info */}
          <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#fff' }}>
              <SealQrCode token={rawToken} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Row label="Route" value={`${fromCity} → ${toCity}`} />
              <Row label="Sender" value={maskEmail(match.sender_email)} />
              <Row label="Carrier" value={maskEmail(match.traveler_email)} />
              <Row label="Issued" value={generatedDate} />
              <Row label="Expires" value={expiresDate} />
              <Row label="Match ref" value={matchId.slice(0, 8).toUpperCase()} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '0 24px' }} />

          {/* Legal instructions */}
          <div style={{ padding: '16px 24px 20px', fontSize: '9.5px', color: '#475569', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '6px', fontWeight: 600 }}>
              Apply across the package opening after the inspection has been completed.
            </p>
            <p style={{ marginBottom: '6px' }}>
              Do not accept if the label is damaged, replaced, mismatched or already activated for another shipment.
            </p>
            <p style={{ color: '#64748b' }}>
              A BootHop SecureSeal records chain of custody. It does not guarantee that the contents are lawful or free from concealed items.
            </p>
          </div>

          {/* Footer */}
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8px', color: '#94a3b8' }}>boothop.com</span>
            <span style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>REF: {seal.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm text-center shadow">
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
