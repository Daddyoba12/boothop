'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Package, MapPin, Navigation, CheckCircle2, Clock, AlertCircle,
  Play, Square, ChevronRight, Plane, Truck, Home, Flag,
} from 'lucide-react';

const MapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-slate-900 border border-white/8 flex items-center justify-center">
      <span className="text-white/30 text-sm">Loading map…</span>
    </div>
  ),
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrackingEvent {
  id: string;
  event_type: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  recorded_by: string;
  created_at: string;
}

interface TrackingPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
}

interface SessionData {
  status: string;
  started_at: string | null;
  ended_at: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_ping_at: string | null;
}

interface MatchData {
  id: string;
  status: string;
  trackingStatus: string | null;
  fromCity: string;
  toCity: string;
  travelDate: string;
  agreedPrice: number | null;
}

interface PageData {
  viewerRole: 'sender' | 'traveller';
  match: MatchData;
  session: SessionData | null;
  points: TrackingPoint[];
  events: TrackingEvent[];
}

// ── Journey milestones ─────────────────────────────────────────────────────────

const MILESTONES = [
  { key: 'collected',            label: 'Package Collected',    icon: Package,     color: 'blue' },
  { key: 'at_departure_airport', label: 'At Departure Airport', icon: MapPin,      color: 'blue' },
  { key: 'flight_departed',      label: 'Flight Departed',      icon: Plane,       color: 'violet' },
  { key: 'flight_landed',        label: 'Flight Landed',        icon: Plane,       color: 'cyan' },
  { key: 'at_destination',       label: 'At Destination',       icon: Home,        color: 'teal' },
  { key: 'out_for_delivery',     label: 'Out for Delivery',     icon: Truck,       color: 'emerald' },
  { key: 'delivered',            label: 'Delivered',            icon: Flag,        color: 'green' },
] as const;

const SYSTEM_EVENTS = new Set(['tracking_started', 'tracking_stopped']);

function eventLabel(type: string): string {
  const m = MILESTONES.find((m) => m.key === type);
  if (m) return m.label;
  if (type === 'tracking_started') return 'Journey tracking started';
  if (type === 'tracking_stopped') return 'Tracking stopped';
  return type.replace(/_/g, ' ');
}

function eventIcon(type: string) {
  const m = MILESTONES.find((m) => m.key === type);
  if (m) return m.icon;
  if (type === 'tracking_started' || type === 'tracking_stopped') return Navigation;
  return Package;
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

function progressFromEvents(events: TrackingEvent[]): number {
  const milestoneKeys = MILESTONES.map((m) => m.key);
  const completed = milestoneKeys.filter((k) =>
    events.some((e) => e.event_type === k)
  );
  return Math.round((completed.length / milestoneKeys.length) * 100);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'journey' | 'map'>('status');

  // Traveller GPS state
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [logResult, setLogResult] = useState('');
  const [loggingEvent, setLoggingEvent] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const watchRef = useRef<number | null>(null);
  const lastPingRef = useRef<number>(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracking/session/${matchId}`, { credentials: 'include' });
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Failed to load'); setLoading(false); return; }
      setData(json);
      if (json.session?.status === 'active') setGpsActive(true);
    } catch {
      setError('Failed to load tracking data');
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  // Stop GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  // ── GPS tracking ─────────────────────────────────────────────────────────────

  function startGPS() {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported on this device'); return; }

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        // Adaptive frequency: 10 min default, reduced to 2 min near likely delivery times
        const INTERVAL = 10 * 60 * 1000;
        if (now - lastPingRef.current < INTERVAL) return;
        lastPingRef.current = now;

        await fetch('/api/tracking/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            matchId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          }),
        }).catch(() => {});
      },
      (err) => {
        if (err.code === 1) setGpsError('Location permission denied. Enable in your browser settings.');
        else setGpsError('Could not get location. Please try again.');
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  }

  function stopGPS() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }

  async function handleStartJourney() {
    setStarting(true);
    setGpsError('');
    try {
      const res = await fetch('/api/tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchId }),
      });
      const json = await res.json();
      if (!json.success) { setGpsError(json.error || 'Failed to start tracking'); return; }
      setGpsActive(true);
      startGPS();
      fetchData();
    } catch {
      setGpsError('Failed to start journey tracking');
    }
    setStarting(false);
  }

  async function handleStopTracking() {
    setStopping(true);
    try {
      stopGPS();
      await fetch('/api/tracking/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchId }),
      });
      setGpsActive(false);
      fetchData();
    } catch {
      /* graceful */
    }
    setStopping(false);
  }

  async function logEvent(eventType: string) {
    setLoggingEvent(eventType);
    setLogResult('');
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch { /* proceed without location */ }

      const res = await fetch('/api/tracking/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchId, eventType, latitude, longitude }),
      });
      const json = await res.json();
      if (json.success) {
        setLogResult(`Logged: ${eventLabel(eventType)}`);
        if (eventType === 'delivered') { stopGPS(); setGpsActive(false); }
        fetchData();
      } else {
        setLogResult(json.error || 'Failed to log event');
      }
    } catch {
      setLogResult('Failed to log event');
    }
    setLoggingEvent(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading tracking…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-400 font-semibold">{error || 'Not found'}</p>
        <Link href="/dashboard" className="text-blue-400 text-sm hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const { viewerRole, match, session, points, events } = data;
  const isTraveller = viewerRole === 'traveller';
  const progress = progressFromEvents(events);
  const journeyEvents = events.filter((e) => !SYSTEM_EVENTS.has(e.event_type));
  const isDelivered = match.trackingStatus === 'delivered' ||
    events.some((e) => e.event_type === 'delivered');

  const completedMilestones = new Set(events.map((e) => e.event_type));

  return (
    <div className="min-h-screen bg-[#07111f] text-white">

      {/* Header */}
      <header className="border-b border-white/8 px-4 py-4 sticky top-0 bg-[#07111f]/95 backdrop-blur z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-bold text-base">BootHop</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 text-xs">Live Tracking</span>
          </div>
          <Link href="/dashboard" className="text-white/30 hover:text-white text-xs transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Route card */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-white font-bold text-lg">
                {match.fromCity} → {match.toCity}
              </h1>
              {match.travelDate && (
                <p className="text-white/40 text-xs mt-0.5">
                  {new Date(match.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              isDelivered
                ? 'bg-green-500/15 text-green-400 border-green-500/25'
                : session?.status === 'active'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                : 'bg-white/8 text-white/40 border-white/10'
            }`}>
              {isDelivered ? (
                <><CheckCircle2 className="w-3 h-3" /> Delivered</>
              ) : session?.status === 'active' ? (
                <><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Live</>
              ) : (
                <><Clock className="w-3 h-3" /> Awaiting</>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/40">
              <span>Journey progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Last ping */}
          {session?.last_ping_at && (
            <p className="text-white/25 text-xs mt-3">
              Last GPS update: {formatTs(session.last_ping_at)}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['status', 'journey', 'map'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab === 'status' ? 'Status' : tab === 'journey' ? 'Journey' : 'Map'}
            </button>
          ))}
        </div>

        {/* ── Status tab ─────────────────────────────────────────────────── */}
        {activeTab === 'status' && (
          <div className="space-y-3">
            {/* Milestone grid */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Package Journey</h2>
              <div className="space-y-0">
                {MILESTONES.map((m, i) => {
                  const done = completedMilestones.has(m.key);
                  const MIcon = m.icon;
                  const event = events.find((e) => e.event_type === m.key);
                  return (
                    <div key={m.key} className="relative flex gap-3">
                      {i < MILESTONES.length - 1 && (
                        <div className={`absolute left-[17px] top-9 bottom-0 w-px ${done ? 'bg-blue-500/40' : 'bg-white/8'}`} />
                      )}
                      <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${
                        done
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10'
                      }`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          : <MIcon className="w-4 h-4 text-white/25" />
                        }
                      </div>
                      <div className="pb-5 flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? 'text-white' : 'text-white/30'}`}>
                          {m.label}
                        </p>
                        {event && (
                          <p className="text-white/35 text-xs mt-0.5">{formatTs(event.created_at)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Journey tab ─────────────────────────────────────────────────── */}
        {activeTab === 'journey' && (
          <div className="space-y-3">

            {/* Traveller controls */}
            {isTraveller && !isDelivered && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-semibold text-sm">Journey Control</h2>
                    <p className="text-white/40 text-xs mt-0.5">
                      {gpsActive ? 'GPS active — sharing your location' : 'Start to share your location'}
                    </p>
                  </div>
                  {gpsActive && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                {!gpsActive ? (
                  <button
                    onClick={handleStartJourney}
                    disabled={starting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all text-sm"
                  >
                    {starting
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Starting…</>
                      : <><Play className="w-4 h-4" />Start Journey</>
                    }
                  </button>
                ) : (
                  <button
                    onClick={handleStopTracking}
                    disabled={stopping}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold rounded-xl transition-all text-sm"
                  >
                    {stopping
                      ? <><div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />Stopping…</>
                      : <><Square className="w-4 h-4" />Stop Tracking</>
                    }
                  </button>
                )}

                {gpsError && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    {gpsError}
                  </p>
                )}

                {/* Milestone log buttons */}
                <div>
                  <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Log milestone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MILESTONES.map(({ key, label, icon: Icon }) => {
                      const done = completedMilestones.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => logEvent(key)}
                          disabled={loggingEvent !== null || done}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            done
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 cursor-default'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40'
                          }`}
                        >
                          {loggingEvent === key
                            ? <div className="w-3.5 h-3.5 border border-white/60 border-t-transparent rounded-full animate-spin" />
                            : done
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            : <Icon className="w-3.5 h-3.5 shrink-0" />
                          }
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {logResult && (
                  <p className="text-sm text-white/70 bg-white/5 rounded-xl px-4 py-2.5">{logResult}</p>
                )}
              </div>
            )}

            {/* Delivered state */}
            {isTraveller && isDelivered && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-semibold">Delivery complete</p>
                <p className="text-white/40 text-xs mt-1">GPS tracking has been turned off</p>
              </div>
            )}

            {/* Event timeline */}
            {journeyEvents.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Timeline</h2>
                <div className="space-y-0">
                  {journeyEvents.map((evt, i) => {
                    const Icon = eventIcon(evt.event_type);
                    return (
                      <div key={evt.id} className="relative flex gap-3">
                        {i < journeyEvents.length - 1 && (
                          <div className="absolute left-[17px] top-9 bottom-0 w-px bg-white/8" />
                        )}
                        <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="pb-5 flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium">{eventLabel(evt.event_type)}</p>
                          {evt.description && (
                            <p className="text-white/40 text-xs mt-0.5">{evt.description}</p>
                          )}
                          <p className="text-white/25 text-xs mt-1">{formatTs(evt.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {journeyEvents.length === 0 && !isTraveller && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
                <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Waiting for the traveller to begin their journey</p>
              </div>
            )}
          </div>
        )}

        {/* ── Map tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <MapboxMap
                points={points}
                fromCity={match.fromCity}
                toCity={match.toCity}
              />
            </div>

            {points.length === 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6 text-center">
                <Navigation className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No GPS points yet</p>
                {!isTraveller && (
                  <p className="text-white/25 text-xs mt-1">Map will update once the traveller starts their journey</p>
                )}
              </div>
            )}

            {points.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">GPS points recorded</span>
                  <span className="text-white/70 font-semibold">{points.length}</span>
                </div>
                {session?.last_ping_at && (
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-white/40">Last update</span>
                    <span className="text-white/70">{formatTs(session.last_ping_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View details link */}
        <Link
          href={`/matches/${matchId}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 text-white/50 hover:text-white text-sm transition-all"
        >
          View match details <ChevronRight className="w-4 h-4" />
        </Link>

        <p className="text-center text-white/15 text-xs pb-6">
          BootHop Ltd · Tracking ID: {matchId?.slice(0, 8)}…
        </p>

      </div>
    </div>
  );
}
