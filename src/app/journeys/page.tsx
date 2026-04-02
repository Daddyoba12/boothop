'use client';

import { useEffect, useState } from 'react';
import { Search, Plane, Calendar, Package, Star, ArrowRight, X, Filter } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

type Trip = {
  id: string;
  user_id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  price: number | null;
  weight: string | null;
  type: 'travel' | 'send' | null;
  created_at?: string;
};

export default function LiveJourneysPage() {
  const supabase = createSupabaseClient();

  const [trips, setTrips]         = useState<Trip[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromCity, setFromCity]   = useState('');
  const [toCity, setToCity]       = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt 1: bare select, date-filtered server-side
      const { data: d1, error: e1 } = await supabase
        .from('trips')
        .select('*')
        .gte('travel_date', tomorrow)
        .order('travel_date', { ascending: true });

      if (!e1 && d1 !== null) {
        setTrips(d1 as Trip[]);
        return;
      }

      // Attempt 2: bare select with no date filter (maybe column name differs)
      const { data: d2, error: e2 } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (!e2 && d2 !== null) {
        // filter client-side
        const fut = d2.filter((t: any) => {
          const dateVal = t.travel_date || t.date || t.departure_date || '';
          return !dateVal || dateVal >= tomorrow;
        });
        setTrips(fut as Trip[]);
        return;
      }

      // Attempt 3: try journeys table
      const { data: d3, error: e3 } = await supabase
        .from('journeys')
        .select('*')
        .gte('departure_date', tomorrow)
        .order('departure_date', { ascending: true });

      if (!e3 && d3 !== null) {
        // normalise journeys → Trip shape
        const mapped = d3.map((j: any) => ({
          id: j.id,
          user_id: j.booter_id,
          from_city: j.from_city,
          to_city: j.to_city,
          travel_date: j.departure_date,
          price: j.price_per_delivery ?? null,
          weight: j.available_space_kg ? `${j.available_space_kg}kg` : null,
          type: 'travel' as const,
        }));
        setTrips(mapped);
        return;
      }

      setError('No trips found. Check back soon — journeys are added daily.');
    } catch (err: any) {
      setError('Unable to load journeys right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = trips.filter((t) => {
    const fromVal = (t.from_city ?? '').toLowerCase();
    const toVal   = (t.to_city   ?? '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return (
      (!q       || fromVal.includes(q) || toVal.includes(q)) &&
      (!fromCity || fromVal.includes(fromCity.toLowerCase())) &&
      (!toCity   || toVal.includes(toCity.toLowerCase())) &&
      (!dateFilter || (t.travel_date ?? '') >= dateFilter)
    );
  });

  const clearFilters = () => { setSearchTerm(''); setFromCity(''); setToCity(''); setDateFilter(''); };
  const hasFilters = !!(searchTerm || fromCity || toCity || dateFilter);

  /* ── Animated field wrapper ── */
  const Field = ({
    id, label, children,
  }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="flex-1 min-w-[120px] relative group">
      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300 ${focusedField === id ? 'text-cyan-400' : 'text-slate-500'}`}>
        {label}
      </label>
      {children}
      {/* Animated underline */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-white/10" />
      <div
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
        style={{ width: focusedField === id ? '100%' : '0%', boxShadow: focusedField === id ? '0 0 8px rgba(34,211,238,0.6)' : 'none' }}
      />
    </div>
  );

  const inputCls = 'w-full bg-transparent pb-3 pt-1 text-sm text-white placeholder:text-slate-600 focus:outline-none';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden flex flex-col">

      {/* AMBIENT BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/GoingonHols1.jpg)',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-900/15 to-slate-950/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/10 via-transparent to-slate-950/10" />

        <div className="relative z-10 pt-28 pb-16 px-6 w-full max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-4 leading-tight drop-shadow-2xl">
            Live{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Journeys
            </span>
          </h1>
          <p className="text-white/80 text-lg font-medium drop-shadow-lg">
            Real trips from verified BootHop travellers
          </p>

          {/* Main search — seamless on photo */}
          <div className="mt-10 max-w-xl mx-auto relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search any city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setFocusedField('search')}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent border-b border-white/20 py-3 pl-8 pr-8 text-white text-lg placeholder:text-white/35 focus:outline-none focus:border-cyan-400/70 transition-colors duration-300"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FILTER STRIP — premium animated underline fields */}
      <div className="relative z-10 bg-slate-950/60 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-end gap-8 md:gap-12">
            <Field id="from" label="From">
              <input
                type="text"
                placeholder="Any city"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                onFocus={() => setFocusedField('from')}
                onBlur={() => setFocusedField(null)}
                className={inputCls}
              />
            </Field>

            <Field id="to" label="To">
              <input
                type="text"
                placeholder="Any city"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                onFocus={() => setFocusedField('to')}
                onBlur={() => setFocusedField(null)}
                className={inputCls}
              />
            </Field>

            <Field id="date" label="Date from">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                min={tomorrow}
                className={`${inputCls} [color-scheme:dark]`}
              />
            </Field>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors duration-200 pb-3"
              >
                <Filter className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50 animate-bounce">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <p className="text-slate-400">Loading live journeys...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{error}</p>
            <button onClick={fetchTrips} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-white font-bold text-lg mb-1">No journeys match your filters</p>
            <p className="text-slate-500 text-sm">Try adjusting or clearing filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400 font-semibold">
                  {filtered.length} {filtered.length === 1 ? 'journey' : 'journeys'} live
                </span>
              </div>
            </div>

            {/* LIST */}
            <div className="space-y-px">
              {filtered.map((trip, i) => (
                <div
                  key={trip.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 border-b border-white/6 hover:bg-white/4 hover:border-white/10 transition-all duration-300 cursor-pointer first:rounded-t-2xl last:rounded-b-2xl last:border-b-0"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Hover left glow */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon + route — main content */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Plane className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-base group-hover:text-cyan-400 transition-colors duration-300">
                          {trip.from_city}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                        <span className="font-black text-white text-base group-hover:text-cyan-400 transition-colors duration-300">
                          {trip.to_city}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {trip.travel_date && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {trip.weight && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Package className="h-3 w-3" />
                            {trip.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type + price — right side */}
                  <div className="flex items-center gap-4 flex-shrink-0 sm:ml-auto">
                    {trip.type && (
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${trip.type === 'travel' ? 'bg-blue-500/12 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20'}`}>
                        {trip.type === 'travel' ? 'Traveller' : 'Sender'}
                      </span>
                    )}
                    {trip.price ? (
                      <div className="text-right">
                        <div className="font-black text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                          £{Number(trip.price).toFixed(0)}
                        </div>
                        <div className="text-xs text-slate-600">budget</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">Negotiable</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all duration-300 hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
