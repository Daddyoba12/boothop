'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Filter,
  Plane,
  MapPin,
  Calendar,
  Star,
  ArrowRight
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Journey } from '@/lib/supabase';

type JourneyWithProfile = Journey & {
  profiles: {
    full_name: string;
    rating: number;
    completed_deliveries: number;
  };
};

export default function BrowseJourneysPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [journeys, setJourneys] = useState<JourneyWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fromCity: '',
    toCity: '',
    departureDate: '',
  });

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      let query = supabase
        .from('journeys')
        .select(`
          *,
          profiles:booter_id (
            full_name,
            rating,
            completed_deliveries
          )
        `)
        .eq('status', 'active')
        .gte('departure_date', new Date().toISOString().split('T')[0])
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

    const matchesFrom = filters.fromCity === '' || 
      journey.from_city.toLowerCase().includes(filters.fromCity.toLowerCase());

    const matchesTo = filters.toCity === '' || 
      journey.to_city.toLowerCase().includes(filters.toCity.toLowerCase());

    const matchesDate = filters.departureDate === '' ||
      journey.departure_date >= filters.departureDate;

    return matchesSearch && matchesFrom && matchesTo && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">BootHop</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About Us
              </Link>
              <Link href="/requests" className="text-gray-600 hover:text-gray-900">
                View Requests
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Journeys</h1>
          <p className="text-gray-600">Find verified travelers going your way</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by city or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="From city"
                value={filters.fromCity}
                onChange={(e) => setFilters({ ...filters, fromCity: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="To city"
                value={filters.toCity}
                onChange={(e) => setFilters({ ...filters, toCity: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                type="date"
                placeholder="Departure date"
                value={filters.departureDate}
                onChange={(e) => setFilters({ ...filters, departureDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <button
                onClick={() => setFilters({ fromCity: '', toCity: '', departureDate: '' })}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-blue-600 animate-bounce mx-auto mb-4" />
            <p className="text-gray-600">Loading journeys...</p>
          </div>
        ) : filteredJourneys.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No journeys found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Found {filteredJourneys.length} {filteredJourneys.length === 1 ? 'journey' : 'journeys'}
            </div>

            <div className="space-y-4">
              {filteredJourneys.map((journey) => (
                <div
                  key={journey.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/journeys/${journey.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plane className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {journey.from_city}, {journey.from_country}
                            <ArrowRight className="inline h-5 w-5 mx-2 text-gray-400" />
                            {journey.to_city}, {journey.to_country}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
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
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {journey.profiles.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{journey.profiles.full_name}</div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span>{journey.profiles.rating.toFixed(1)}</span>
                            </div>
                            <span>•</span>
                            <span>{journey.profiles.completed_deliveries} deliveries</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {journey.price_per_delivery ? (
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            £{Number(journey.price_per_delivery).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">per delivery</div>
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                          Negotiable
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {journey.excludes && journey.excludes.length > 0 && (
                      <span className="text-xs px-3 py-1 bg-red-50 text-red-700 rounded-full">
                        Excludes: {journey.excludes.join(', ')}
                      </span>
                    )}
                    {journey.accepts_only && journey.accepts_only.length > 0 && (
                      <span className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full">
                        Accepts: {journey.accepts_only.join(', ')}
                      </span>
                    )}
                    {journey.max_dimensions && (
                      <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
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
