'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { validateBarcode, qrImageUrl } from '@/lib/utils/barcode';

// Dynamic imports for SSR safety
const QRCode = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false });

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false, loading: () => (
  <div className="w-full h-[280px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
    <span className="text-white/30 text-sm">Loading map…</span>
  </div>
) });

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  type: string; label: string; timestamp: string;
  location?: string; lat?: number; lng?: number; photo?: string; notes?: string; initiatedBy?: string;
  icon: string;
}

interface MatchInfo {
  id: string; status: string; trackingStatus: string; tier: string; premiumTracking: boolean;
  fromCity: string; toCity: string; travelDate: string;
  senderBarcode: string; travellerBarcode: string;
  viewerRole: 'sender' | 'traveller'; myBarcode: string;
}

interface TrackingData {
  match: MatchInfo;
  timeline: TimelineEntry[];
  checkpoints: { latitude: number; longitude: number; address: string; checkpoint_type: string; created_at: string; photo_url?: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = { p2p: '#3b82f6', business: '#f59e0b', priority: '#10b981' };
const TIER_LABELS: Record<string, string> = { p2p: 'P2P', business: 'Business', priority: 'Priority' };

const CP_ICONS: Record<string, string> = {
  pickup: '📦', transit: '✈️', delivered: '✅', location_check: '📍',
  matched: '🔗', payment: '💳', expected: '📅',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:       { label: 'Live',        color: 'text-emerald-400' },
  in_transit:   { label: 'In Transit',  color: 'text-blue-400' },
  delivered:    { label: 'Delivered',   color: 'text-emerald-400' },
  completed:    { label: 'Completed',   color: 'text-emerald-400' },
};

// ── Formatting ────────────────────────────────────────────────────────────────

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TrackPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const [data, setData]           = useState<TrackingData | null>(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  const [locResult, setLocResult]   = useState<string>('');
  const [showQR, setShowQR]         = useState(false);
  const [sharing, setSharing]       = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!validateBarcode(barcode)) { setError('Invalid barcode'); setLoading(false); return; }
    try {
      const res  = await fetch(`/api/tracking/get-history?barcode=${barcode}`);
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Not found'); setLoading(false); return; }
      setData(json);
    } catch { setError('Failed to load tracking data'); }
    setLoading(false);
  }, [barcode]);

  useEffect(() => {
    fetchData();
    // Refresh every 30s
    pollRef.current = setInterval(fetchData, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  // Sender: ping traveller for location
  async function requestLocation() {
    setLocLoading(true);
    setLocResult('');
    try {
      const res  = await fetch('/api/tracking/scan-sender-barcode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderBarcode: barcode }),
      });
      const json = await res.json();
      if (json.status === 'delivered') {
        setLocResult(`📍 Location received: ${json.location?.address || 'unknown'}`);
        fetchData(); // refresh timeline
      } else if (json.status === 'rate_limited') {
        setLocResult(`⏳ ${json.message}`);
      } else if (json.status === 'timeout') {
        setLocResult(`⌛ No response. Last known: ${json.lastKnown?.address || 'unknown'}`);
      } else if (json.status === 'declined') {
        setLocResult(`🚫 ${json.message}`);
      } else {
        setLocResult(json.error || 'Unknown response');
      }
    } catch { setLocResult('Failed to request location'); }
    setLocLoading(false);
  }

  // Traveller: share current location
  async function shareLocation(cpType: string) {
    setSharing(true);
    setLocResult('');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const response = await fetch('/api/tracking/share-location', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travellerBarcode: barcode,
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          checkpointType: cpType,
        }),
      });
      const json = await response.json();
      if (json.success) {
        setLocResult(`✅ Location shared: ${json.checkpoint?.location}`);
        fetchData();
      } else {
        setLocResult(json.error || 'Failed to share location');
      }
    } catch (e: any) {
      setLocResult(e.code === 1 ? '📍 Location permission denied. Please enable in browser settings.' : 'Failed to get location');
    }
    setSharing(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading tracking data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg font-semibold mb-2">Not Found</p>
        <p className="text-white/40 text-sm">{error}</p>
        <p className="text-white/25 text-xs mt-4">Check your barcode and try again</p>
      </div>
    </div>
  );

  const { match, timeline, checkpoints } = data!;
  const isSender  = match.viewerRole === 'sender';
  const isTraveller = match.viewerRole === 'traveller';
  const tierColor = TIER_COLORS[match.tier] || '#3b82f6';
  const status    = STATUS_LABELS[match.trackingStatus] || { label: match.trackingStatus, color: 'text-white/60' };
  const mapPoints = checkpoints.filter(c => c.latitude && c.longitude).map(c => ({
    lat: c.latitude, lng: c.longitude, label: c.address, type: c.checkpoint_type,
  }));

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold text-lg">BootHop</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 text-sm">Live Tracking</span>
          </div>
          <button onClick={() => setShowQR(v => !v)} className="flex items-center gap-2 text-xs text-white/40 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
            <span>📱</span>
            <span>{showQR ? 'Hide' : 'Show'} QR</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Match summary card */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-white font-semibold text-lg">{match.fromCity} → {match.toCity}</h1>
              <p className="text-white/40 text-sm mt-0.5">{match.travelDate}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${tierColor}22`, color: tierColor }}>
                {TIER_LABELS[match.tier]} Tracking
              </span>
              {match.premiumTracking && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-500/20 text-violet-400">⭐ Premium</span>
              )}
            </div>
          </div>

          {/* Barcode display */}
          <div className="bg-[#0f172a] border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-white/30 text-xs tracking-widest mb-1">{isSender ? 'YOUR SENDER BARCODE' : 'YOUR CARRIER BARCODE'}</p>
            <p className="text-blue-400 font-mono text-base font-bold tracking-widest">{barcode}</p>
          </div>

          {/* QR Code panel */}
          {showQR && (
            <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-white rounded-2xl">
              <QRCode value={barcode} size={180} level="M" />
              <p className="text-gray-500 text-xs">Scan to open tracking page</p>
            </div>
          )}
        </div>

        {/* Action panel */}
        {isSender && match.trackingStatus !== 'completed' && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
            <h2 className="text-white font-semibold mb-1">Request Location Update</h2>
            <p className="text-white/40 text-sm mb-4">Ping your traveller to share their current location.</p>
            <button
              onClick={requestLocation}
              disabled={locLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {locLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Waiting for response…</span></>
              ) : (
                <><span>📍</span><span>Ping Traveller</span></>
              )}
            </button>
            {locResult && <p className="mt-3 text-sm text-white/70 bg-white/5 rounded-xl px-4 py-3">{locResult}</p>}
          </div>
        )}

        {isTraveller && match.trackingStatus !== 'completed' && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
            <h2 className="text-white font-semibold mb-1">Share Your Location</h2>
            <p className="text-white/40 text-sm mb-4">Update the sender with your current checkpoint.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { type: 'pickup', label: '📦 Picked Up' },
                { type: 'transit', label: '✈️ In Transit' },
                { type: 'location_check', label: '📍 Location' },
                { type: 'delivered', label: '✅ Delivered' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => shareLocation(type)}
                  disabled={sharing}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors text-sm text-white/70 hover:text-white"
                >
                  {label.split(' ')[0]}
                  <span className="text-xs">{label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            {locResult && <p className="mt-3 text-sm text-white/70 bg-white/5 rounded-xl px-4 py-3">{locResult}</p>}
          </div>
        )}

        {/* Map */}
        {mapPoints.length > 0 && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <MapComponent points={mapPoints} />
          </div>
        )}

        {/* Timeline */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-white font-semibold mb-5">Tracking Timeline</h2>
          <div className="space-y-0">
            {timeline.map((entry, i) => (
              <div key={i} className="relative flex gap-4">
                {/* Vertical line */}
                {i < timeline.length - 1 && (
                  <div className="absolute left-[17px] top-8 bottom-0 w-px bg-white/8" />
                )}
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-base">
                  {CP_ICONS[entry.icon] || '●'}
                </div>
                {/* Content */}
                <div className="pb-6 flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">{entry.label}</p>
                  {entry.location && <p className="text-white/40 text-xs mt-0.5 truncate">{entry.location}</p>}
                  {entry.notes && <p className="text-white/30 text-xs mt-0.5 italic">{entry.notes}</p>}
                  <p className="text-white/25 text-xs mt-1">{formatTs(entry.timestamp)}</p>
                  {entry.photo && (
                    <div className="mt-2">
                      <Image src={entry.photo} alt="Checkpoint photo" width={160} height={100} className="rounded-lg object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs pb-8">
          BootHop Ltd · Registered in England &amp; Wales ·{' '}
          <a href="mailto:info@boothop.com" className="hover:text-white/40 transition-colors">info@boothop.com</a>
        </p>

      </div>
    </div>
  );
}
