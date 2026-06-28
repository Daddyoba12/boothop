'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BFIFlightOffer, BFIRoute, BFIRouteStats } from '@/lib/bfi/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AirportInfo { name: string; city: string; country: string }
interface PricePoint  { date: string; cheapest_price_gbp: number; cheapest_airline: string | null }
interface CalendarDay { departure_date: string; price_gbp: number; airline_name: string }
interface MatchData   { travelers: number; senders: number; hasActivity: boolean }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(mins: number | null): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildGoUrl(offer: BFIFlightOffer): string {
  const session = typeof crypto !== 'undefined' ? crypto.randomUUID().slice(0, 8) : 'x';
  return `/api/bfi/go?offer=${offer.id}&session=${session}`;
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

function recBadge(r: string) {
  if (r === 'BUY')  return 'bg-green-900 text-green-300 border-green-700';
  if (r === 'WAIT') return 'bg-red-900   text-red-300   border-red-700';
  return                   'bg-gray-800  text-gray-300  border-gray-700';
}

function trendArrow(trend: string) {
  if (trend === 'falling') return '↓';
  if (trend === 'rising')  return '↑';
  return '→';
}

// ── SVG Price History Chart ───────────────────────────────────────────────────

function PriceChart({ points }: { points: PricePoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm bg-gray-900 rounded-xl">
        Not enough scan history yet — data builds up after a few days of scans.
      </div>
    );
  }

  const W = 600; const H = 180; const PAD = { top: 20, right: 20, bottom: 40, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const prices = points.map(p => p.cheapest_price_gbp);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const range  = maxP - minP || 1;

  const xScale = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const yScale = (p: number) => PAD.top  + innerH - ((p - minP) / range) * innerH;

  const polyline = points.map((p, i) => `${xScale(i)},${yScale(p.cheapest_price_gbp)}`).join(' ');

  // Y grid: 4 lines
  const gridPrices = [0, 1, 2, 3].map(i => minP + (range * i) / 3);

  // X labels: first, middle, last
  const xLabelIdx = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Price history chart"
    >
      {/* Grid lines */}
      {gridPrices.map((p, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={yScale(p)} x2={W - PAD.right} y2={yScale(p)}
            stroke="#1f2937" strokeWidth="1"
          />
          <text x={PAD.left - 6} y={yScale(p) + 4} textAnchor="end" fontSize="10" fill="#6b7280">
            £{Math.round(p)}
          </text>
        </g>
      ))}

      {/* Gradient fill */}
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon
        points={`${xScale(0)},${PAD.top + innerH} ${polyline} ${xScale(points.length - 1)},${PAD.top + innerH}`}
        fill="url(#chartGrad)"
      />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(p.cheapest_price_gbp)} r="3" fill="#60a5fa" />
      ))}

      {/* X labels */}
      {xLabelIdx.map(i => (
        <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
          {new Date(points[i].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </text>
      ))}
    </svg>
  );
}

// ── Fare Calendar ─────────────────────────────────────────────────────────────

function FareCalendar({
  days, avg,
}: {
  days: CalendarDay[];
  avg: number | null;
}) {
  if (!days.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm bg-gray-900 rounded-xl">
        No forward-looking fare data yet — check back after the next scan.
      </div>
    );
  }

  const baseline = avg ?? (days.reduce((s, d) => s + d.price_gbp, 0) / days.length);

  function dayClass(price: number) {
    if (price <= baseline * 0.92) return 'bg-green-900/60 border-green-700/50 text-green-300';
    if (price <= baseline * 1.05) return 'bg-gray-800/60 border-gray-700/50 text-gray-300';
    return 'bg-red-900/30 border-red-800/30 text-red-400';
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-900 border border-green-700" /> Cheap (≤ avg)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 border border-gray-700" /> Average</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-900/30 border border-red-800/30" /> Above avg</span>
        {avg && <span>Avg: <span className="text-white font-medium">£{avg.toFixed(0)}</span></span>}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
        {days.map(d => {
          const date = new Date(d.departure_date);
          return (
            <div
              key={d.departure_date}
              className={`rounded-xl border p-2.5 text-center transition-all hover:scale-105 cursor-default ${dayClass(d.price_gbp)}`}
            >
              <p className="text-[10px] font-medium opacity-70">
                {date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </p>
              <p className="text-[11px] font-bold">
                {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-sm font-bold mt-0.5">£{d.price_gbp.toFixed(0)}</p>
              <p className="text-[9px] opacity-60 truncate mt-0.5">{d.airline_name.split(' ')[0]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sprint 3: BootHop Match Layer ─────────────────────────────────────────────

function MatchLayer({
  origin, destination, cheapestPrice,
}: {
  origin:       string;
  destination:  string;
  cheapestPrice: number | null;
}) {
  const [data, setData] = useState<MatchData | null>(null);

  useEffect(() => {
    fetch(`/api/bfi/match-layer?origin=${origin}&destination=${destination}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, [origin, destination]);

  const earningEstimate = cheapestPrice
    ? `£${Math.round(cheapestPrice * 0.35)}–£${Math.round(cheapestPrice * 0.9)}`
    : '£150–£350';

  return (
    <div className="bg-gradient-to-br from-[#080f1f] via-gray-900 to-[#071810] border border-blue-800/30 rounded-2xl p-6 md:p-8">

      {/* Live header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse shrink-0" />
        <p className="text-sm text-green-400 font-semibold">
          {data?.travelers
            ? `${data.travelers} verified BootHop traveller${data.travelers !== 1 ? 's' : ''} flying this route this week`
            : 'BootHop travellers active on this route'
          }
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
        Don&apos;t just book a flight. Turn it into income.
      </h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xl">
        Every traveller on this route can earn {earningEstimate} carrying verified BootHop packages.
        Every sender saves 60–80% vs traditional couriers.
      </p>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Traveller panel */}
        <div className="bg-blue-950/50 border border-blue-800/40 rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✈️</span>
            <p className="text-blue-300 font-semibold text-sm">Travelling on this route?</p>
          </div>
          <p className="text-gray-200 text-sm mb-1 flex-1">
            Earn up to{' '}
            <span className="text-green-400 font-bold text-base">{earningEstimate}</span>{' '}
            carrying verified BootHop packages on your trip.
          </p>
          {cheapestPrice && (
            <p className="text-gray-500 text-xs mb-3">
              Your £{cheapestPrice.toFixed(0)} flight could pay for itself — and more.
            </p>
          )}
          {data?.travelers ? (
            <p className="text-xs text-blue-400/70 mb-4">
              {data.travelers} traveller{data.travelers !== 1 ? 's' : ''} already doing this this month
            </p>
          ) : null}
          <Link
            href="/register?type=booter"
            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm mt-auto"
          >
            Become a Booter — Earn {earningEstimate} →
          </Link>
        </div>

        {/* Sender panel */}
        <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📦</span>
            <p className="text-emerald-300 font-semibold text-sm">Need to send something?</p>
          </div>
          <p className="text-gray-200 text-sm mb-1 flex-1">
            Skip the £200+ courier bill. Send packages with verified travellers on this route —{' '}
            <span className="text-emerald-400 font-bold text-base">from £25</span>.
          </p>
          <p className="text-gray-500 text-xs mb-3">
            {data?.travelers
              ? `${data.travelers} traveller${data.travelers !== 1 ? 's' : ''} available for direct match.`
              : 'Post your delivery and match with a verified traveller today.'
            }
          </p>
          {data?.senders ? (
            <p className="text-xs text-emerald-400/70 mb-4">
              {data.senders} active sender{data.senders !== 1 ? 's' : ''} on the reverse route right now
            </p>
          ) : null}
          <Link
            href="/send"
            className="block w-full text-center bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm mt-auto"
          >
            Send a Package — Save 70% vs DHL →
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Airline mini-list from today's offers ─────────────────────────────────────

function AirlinesTab({ offers, origin, destination }: { offers: BFIFlightOffer[]; origin: string; destination: string }) {
  const byAirline: Record<string, { name: string; count: number; min: number; avg: number }> = {};
  for (const o of offers) {
    const key = o.airline_code;
    if (!byAirline[key]) byAirline[key] = { name: o.airline_name, count: 0, min: Infinity, avg: 0 };
    byAirline[key].count++;
    byAirline[key].min = Math.min(byAirline[key].min, o.price_gbp);
    byAirline[key].avg += o.price_gbp;
  }
  const rows = Object.entries(byAirline)
    .map(([code, v]) => ({ code, ...v, avg: v.avg / v.count }))
    .sort((a, b) => a.min - b.min);

  if (!rows.length) {
    return <p className="text-gray-500 text-sm">No airline data for today.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div
          key={r.code}
          className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 hover:border-gray-700 transition-colors"
        >
          <div>
            <Link
              href={`/flights/airlines/${r.code.toLowerCase()}`}
              className="font-semibold text-white hover:text-blue-400 transition-colors"
            >
              {r.name}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{r.code} · {r.count} fare{r.count !== 1 ? 's' : ''} found today</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-white">From £{r.min.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Avg £{r.avg.toFixed(0)}</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-600 pt-2 text-center">
        Click an airline to see full route stats →
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type TabId = 'today' | 'calendar' | 'history' | 'airlines';

export default function RouteDetail({
  route, origin, destination, offers, cheapest, stats,
  todayViews, todayClicks, priceHistory, fareCalendar,
}: {
  route:        BFIRoute;
  origin:       AirportInfo;
  destination:  AirportInfo;
  offers:       BFIFlightOffer[];
  cheapest:     BFIFlightOffer | null;
  stats:        BFIRouteStats | null;
  todayViews:   number;
  todayClicks:  number;
  priceHistory: PricePoint[];
  fareCalendar: CalendarDay[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  const TABS: { id: TabId; label: string }[] = [
    { id: 'today',    label: "Today's Flights" },
    { id: 'calendar', label: 'Fare Calendar'   },
    { id: 'history',  label: 'Price History'   },
    { id: 'airlines', label: 'Airlines'         },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">BootHop</Link>
          <span>/</span>
          <Link href="/flights" className="hover:text-white transition-colors">Flights</Link>
          <span>/</span>
          <Link
            href={`/flights/airports/${route.origin.toLowerCase()}`}
            className="hover:text-blue-400 transition-colors"
          >
            {origin.city}
          </Link>
          <span>/</span>
          <Link
            href={`/flights/airports/${route.destination.toLowerCase()}`}
            className="hover:text-blue-400 transition-colors"
          >
            {destination.city}
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {origin.city} → {destination.city}
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            {origin.name} ({route.origin})&nbsp;→&nbsp;{destination.name} ({route.destination})
          </p>
        </div>

        {/* Cheapest hero */}
        {cheapest ? (
          <div className="bg-gradient-to-br from-blue-950 to-gray-900 border border-blue-800/60 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
                Today&apos;s Cheapest
              </p>
              {todayViews > 0 && (
                <p className="text-xs text-gray-600">
                  {todayViews} views{todayClicks > 0 ? ` · ${todayClicks} booked` : ''} today
                </p>
              )}
            </div>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="text-5xl font-bold text-white">£{cheapest.price_gbp.toFixed(0)}</p>
                <p className="text-gray-300 mt-1 font-medium">{cheapest.airline_name}</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {cheapest.stops === 0 ? 'Direct' : `${cheapest.stops} stop${cheapest.stops > 1 ? 's' : ''}`}
                  {cheapest.travel_time_mins ? ` · ${fmt(cheapest.travel_time_mins)}` : ''}
                  {cheapest.baggage_included ? ' · Bags included' : ''}
                </p>
              </div>
              <a
                href={buildGoUrl(cheapest)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] text-base"
              >
                Book Flight →
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
            No fares scanned today. Check back after the next scheduled scan.
          </div>
        )}

        {/* ── SPRINT 3: MATCH LAYER — primary conversion pitch ── */}
        <MatchLayer
          origin={route.origin}
          destination={route.destination}
          cheapestPrice={cheapest?.price_gbp ?? null}
        />

        {/* Intelligence stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Cheapest Ever',    value: stats.all_time_lowest_gbp ? `£${stats.all_time_lowest_gbp.toFixed(0)}` : '—', sub: 'all time'   },
              { label: '30-Day Average',   value: stats.thirty_day_avg_gbp  ? `£${stats.thirty_day_avg_gbp.toFixed(0)}`  : '—', sub: 'rolling'   },
              { label: 'Trend',            value: `${trendArrow(stats.trend)} ${stats.trend}`,                                  sub: '7-day'      },
              { label: 'Opportunity',      value: `${stats.opportunity_score}/100`, valueClass: scoreColor(stats.opportunity_score),
                badge: stats.recommendation, badgeClass: recBadge(stats.recommendation) },
            ].map(col => (
              <div key={col.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1.5">{col.label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-xl font-bold capitalize ${col.valueClass ?? 'text-white'}`}>
                    {col.value}
                  </p>
                  {col.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${col.badgeClass}`}>
                      {col.badge}
                    </span>
                  )}
                </div>
                {col.sub && <p className="text-[10px] text-gray-600 mt-1">{col.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500 font-medium'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'today' && (
            <div className="space-y-2.5">
              {!offers.length ? (
                <p className="text-gray-500 text-sm">No offers available yet — check back after the next scan.</p>
              ) : (
                offers.slice(0, 15).map(offer => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-white">{offer.airline_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {offer.flight_number ?? ''}
                        {' · '}
                        {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
                        {offer.travel_time_mins ? ` · ${fmt(offer.travel_time_mins)}` : ''}
                        {offer.baggage_included ? ' · Bags ✓' : ''}
                        {offer.departure_at ? ` · ${new Date(offer.departure_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <p className="text-xl font-bold text-white">£{offer.price_gbp.toFixed(0)}</p>
                      <a
                        href={buildGoUrl(offer)}
                        className="text-sm px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                      >
                        Book →
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <FareCalendar
              days={fareCalendar}
              avg={stats?.thirty_day_avg_gbp ?? null}
            />
          )}

          {activeTab === 'history' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Daily cheapest fare scanned over the last 30 days
              </p>
              <PriceChart points={priceHistory} />
              {priceHistory.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Lowest recorded', value: `£${Math.min(...priceHistory.map(p => p.cheapest_price_gbp)).toFixed(0)}` },
                    { label: 'Highest recorded', value: `£${Math.max(...priceHistory.map(p => p.cheapest_price_gbp)).toFixed(0)}` },
                    { label: 'Data points',      value: `${priceHistory.length} days` },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className="text-lg font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'airlines' && (
            <AirlinesTab offers={offers} origin={route.origin} destination={route.destination} />
          )}
        </div>

        {/* Airport hub links */}
        <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>Explore hubs:</span>
          <Link href={`/flights/airports/${route.origin.toLowerCase()}`} className="hover:text-blue-400 transition-colors">
            All flights from {origin.city} →
          </Link>
          <Link href={`/flights/airports/${route.destination.toLowerCase()}`} className="hover:text-blue-400 transition-colors">
            All flights to {destination.city} →
          </Link>
        </div>

      </div>
    </div>
  );
}
