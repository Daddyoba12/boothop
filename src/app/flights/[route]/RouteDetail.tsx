'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function MatchLayer({ origin, destination }: { origin: string; destination: string }) {
  const [data, setData] = useState<{ travelers: number; senders: number; hasActivity: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/bfi/match-layer?origin=${origin}&destination=${destination}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, [origin, destination]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Traveller panel */}
      <div className="bg-gray-900/60 border border-dashed border-blue-900 rounded-2xl p-6">
        <p className="text-sm text-blue-400 font-medium mb-2">Travelling on this route?</p>
        <p className="text-gray-300 text-sm mb-1">
          Earn up to <span className="text-green-400 font-bold">£350</span> by carrying verified BootHop packages on your trip.
        </p>
        {data?.travelers ? (
          <p className="text-xs text-gray-500 mb-3">
            {data.travelers} verified BootHop traveller{data.travelers > 1 ? 's' : ''} already flying this route this month.
          </p>
        ) : null}
        <Link href="/register" className="inline-block mt-2 text-sm bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors">
          Become a Booter →
        </Link>
      </div>

      {/* Sender panel */}
      <div className="bg-gray-900/60 border border-dashed border-green-900 rounded-2xl p-6">
        <p className="text-sm text-green-400 font-medium mb-2">Need to send something?</p>
        <p className="text-gray-300 text-sm mb-1">
          Skip the courier. Send packages with verified travellers on this route — faster and cheaper.
        </p>
        {data?.senders ? (
          <p className="text-xs text-gray-500 mb-3">
            {data.senders} active sender{data.senders > 1 ? 's' : ''} on the reverse route right now.
          </p>
        ) : null}
        <Link href="/send" className="inline-block mt-2 text-sm bg-green-800 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition-colors">
          Send a Package →
        </Link>
      </div>
    </div>
  );
}
import type { BFIFlightOffer, BFIRoute, BFIRouteStats } from '@/lib/bfi/types';

interface AirportInfo { name: string; city: string; country: string }

function fmt(mins: number | null): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

function trendArrow(trend: string) {
  if (trend === 'falling') return '↓';
  if (trend === 'rising')  return '↑';
  return '→';
}

function recommendationStyle(r: string) {
  if (r === 'BUY')  return 'bg-green-900 text-green-300 border-green-700';
  if (r === 'WAIT') return 'bg-red-900   text-red-300   border-red-700';
  return                   'bg-gray-800  text-gray-300  border-gray-700';
}

function buildGoUrl(offer: BFIFlightOffer): string {
  const session = typeof crypto !== 'undefined' ? crypto.randomUUID().slice(0, 8) : 'x';
  return `/api/bfi/go?offer=${offer.id}&session=${session}`;
}

export default function RouteDetail({
  route, origin, destination, offers, cheapest, stats, todayViews, todayClicks,
}: {
  route:        BFIRoute;
  origin:       AirportInfo;
  destination:  AirportInfo;
  offers:       BFIFlightOffer[];
  cheapest:     BFIFlightOffer | null;
  stats:        BFIRouteStats | null;
  todayViews:   number;
  todayClicks:  number;
}) {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500">
          <Link href="/" className="hover:text-white">BootHop</Link>
          {' / '}
          <span className="text-gray-300">{origin.city} → {destination.city}</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {origin.city} → {destination.city}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {origin.name} ({route.origin}) to {destination.name} ({route.destination})
          </p>
        </div>

        {/* Hero — cheapest flight */}
        {cheapest ? (
          <div className="bg-gradient-to-br from-blue-950 to-gray-900 border border-blue-800 rounded-2xl p-6">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-3">Today&apos;s Cheapest</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="text-5xl font-bold text-white">£{cheapest.price_gbp.toFixed(0)}</p>
                <p className="text-gray-300 mt-1">{cheapest.airline_name}</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {cheapest.stops === 0 ? 'Direct' : `${cheapest.stops} stop${cheapest.stops > 1 ? 's' : ''}`}
                  {cheapest.travel_time_mins ? ` · ${fmt(cheapest.travel_time_mins)}` : ''}
                  {cheapest.baggage_included ? ' · Bags included' : ''}
                </p>
              </div>
              <div className="text-right">
                <a
                  href={buildGoUrl(cheapest)}
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
                >
                  Book Flight →
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  {todayViews > 0 && `${todayViews} people viewed today`}
                  {todayViews > 0 && todayClicks > 0 && ' · '}
                  {todayClicks > 0 && `${todayClicks} clicked`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
            No fares scanned today. Check back after the next scheduled scan.
          </div>
        )}

        {/* Intelligence panel */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Cheapest Ever</p>
              <p className="text-xl font-bold text-white">
                {stats.all_time_lowest_gbp ? `£${stats.all_time_lowest_gbp.toFixed(0)}` : '—'}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">30-Day Average</p>
              <p className="text-xl font-bold text-white">
                {stats.thirty_day_avg_gbp ? `£${stats.thirty_day_avg_gbp.toFixed(0)}` : '—'}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Price Trend</p>
              <p className="text-xl font-bold text-gray-300">
                {trendArrow(stats.trend)} <span className="text-sm capitalize">{stats.trend}</span>
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Opportunity</p>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-bold ${scoreColor(stats.opportunity_score)}`}>
                  {stats.opportunity_score}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${recommendationStyle(stats.recommendation)}`}>
                  {stats.recommendation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-800 mb-5">
            {(['today', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'today' ? "Today's Flights" : 'Price History'}
              </button>
            ))}
          </div>

          {activeTab === 'today' && (
            <div className="space-y-3">
              {offers.length === 0 ? (
                <p className="text-gray-500 text-sm">No offers available yet.</p>
              ) : (
                offers.slice(0, 12).map(offer => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-white">{offer.airline_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {offer.flight_number ?? ''}
                          {offer.stops === 0 ? ' · Direct' : ` · ${offer.stops} stop`}
                          {offer.travel_time_mins ? ` · ${fmt(offer.travel_time_mins)}` : ''}
                          {offer.baggage_included ? ' · Bags ✓' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-white">£{offer.price_gbp.toFixed(0)}</p>
                      <a
                        href={buildGoUrl(offer)}
                        className="text-sm px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Book →
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
              Price history charts coming in Sprint 3. Data is already being collected.
            </div>
          )}
        </div>

        {/* BootHop Match Layer — live */}
        <MatchLayer origin={route.origin} destination={route.destination} />

      </div>
    </div>
  );
}
