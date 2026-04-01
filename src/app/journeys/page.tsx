'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Search, Plane, MapPin, Calendar, Star, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import type { Journey } from '@/lib/supabase';
import BootHopLogo from '@/components/BootHopLogo';

type JourneyWithProfile = Journey & {
  profiles: {
    full_name: string;
    rating: number;
    completed_deliveries: number;
  };
};

export default function BrowseJourneysPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [journeys, setJourneys] = useState<JourneyWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ fromCity: '', toCity: '', departureDate: '' });

  useEffect(() => { fetchJourneys(); }, []);

  const fetchJourneys = async () => {
    // Same-day trips are never listed — only journeys from tomorrow onwards
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    try {
      let query = supabase
        .from('journeys')
        .select(`*, profiles:booter_id (full_name, rating, completed_deliveries)`)
        .eq('status', 'active')
        .gte('departure_date', tomorrow)
        .order('departure_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setJourneys(data as JourneyWithProfile[] || []);
    } catch (error) {
      console.error('Error fetching journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch = searchTerm === '' ||
      journey.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.to_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.from_country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journey.to_country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFrom = filters.fromCity === '' || journey.from_city.toLowerCase().includes(filters.fromCity.toLowerCase());
    const matchesTo = filters.toCity === '' || journey.to_city.toLowerCase().includes(filters.toCity.toLowerCase());
    const matchesDate = filters.departureDate === '' || journey.departure_date >= filters.departureDate;
    return matchesSearch && matchesFrom && matchesTo && matchesDate;
  });

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/12 backdrop-blur-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">

      {/* ANIMATED BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <BootHopLogo iconClass="text-white" textClass="text-white" />
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <Link href="/requests" className="hover:text-white transition">View Requests</Link>
            <Link href="/login" className="hover:text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* HERO — GoingonHols1.jpg background */}
      <section className="relative min-h-[50vh] flex items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/GoingonHols1.jpg)',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/55 to-slate-950/95" />

        {/* Ping dots */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-24 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay:'1s'}} />
        </div>

        <div className="relative z-10 pt-36 pb-16 px-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-6 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Live Journeys</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            Browse{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
              Journeys
            </span>
          </h1>
          <p className="text-slate-300 text-xl">Find verified travelers going your way</p>
          <p className="mt-3 text-sm text-slate-500">Showing journeys from tomorrow onwards — same-day trips are not listed.</p>
        </div>
      </section>

      {/* SEARCH & FILTERS */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-8 mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-4 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by city or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputCls} pl-12`}
                />
              </div>
            </div>
            <input type="text" placeholder="From city" value={filters.fromCity}
              onChange={(e) => setFilters({...filters, fromCity: e.target.value})} className={inputCls} />
            <input type="text" placeholder="To city" value={filters.toCity}
              onChange={(e) => setFilters({...filters, toCity: e.target.value})} className={inputCls} />
            <input type="date" placeholder="Departure date" value={filters.departureDate}
              onChange={(e) => setFilters({...filters, departureDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className={`${inputCls} [color-scheme:dark]`} />
            <button onClick={() => setFilters({fromCity:'',toCity:'',departureDate:''})}
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
              <Filter className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50 animate-bounce">
              <Package className="h-8 w-8 text-white" />
            </div>
            <p className="text-slate-400 text-lg">Loading journeys...</p>
          </div>
        ) : filteredJourneys.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-white mb-2 font-bold text-xl">No journeys found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400 font-semibold">
                  {filteredJourneys.length} {filteredJourneys.length === 1 ? 'journey' : 'journeys'} found
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {filteredJourneys.map((journey) => (
                <div
                  key={journey.id}
                  onClick={() => router.push(`/journeys/${journey.id}`)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:border-blue-500/50 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                          <Plane className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors duration-300">
                            {journey.from_city}, {journey.from_country}
                            <ArrowRight className="inline h-5 w-5 mx-2 text-slate-500" />
                            {journey.to_city}, {journey.to_country}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(journey.departure_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{journey.available_space_kg}kg available</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booter Info */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {journey.profiles.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{journey.profiles.full_name}</div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              <span className="text-amber-400">{journey.profiles.rating.toFixed(1)}</span>
                            </div>
                            <span>·</span>
                            <span>{journey.profiles.completed_deliveries} deliveries</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {journey.price_per_delivery ? (
                        <div>
                          <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            £{Number(journey.price_per_delivery).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500">per delivery</div>
                        </div>
                      ) : (
                        <div className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-700/50 text-sm font-semibold text-slate-300">
                          Negotiable
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="relative flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {journey.excludes && journey.excludes.length > 0 && (
                      <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                        Excludes: {journey.excludes.join(', ')}
                      </span>
                    )}
                    {journey.accepts_only && journey.accepts_only.length > 0 && (
                      <span className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        Accepts: {journey.accepts_only.join(', ')}
                      </span>
                    )}
                    {journey.max_dimensions && (
                      <span className="text-xs px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                        Max: {journey.max_dimensions}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
