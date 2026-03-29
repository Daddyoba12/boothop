'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  MapPin,
  Calendar,
  Star,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import type { DeliveryRequest } from '@/lib/supabase';

type RequestWithProfile = DeliveryRequest & {
  profiles: {
    full_name: string;
    rating: number;
    total_deliveries: number;
  };
};

export default function BrowseRequestsPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    pickupCity: '',
    deliveryCity: '',
    urgency: 'all',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('delivery_requests')
        .select(`
          *,
          profiles:hooper_id (
            full_name,
            rating,
            total_deliveries
          )
        `)
        .eq('status', 'open')
        .gte('preferred_pickup_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data as RequestWithProfile[] || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.pickup_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.delivery_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.item_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPickup = filters.pickupCity === '' || 
      request.pickup_city.toLowerCase().includes(filters.pickupCity.toLowerCase());

    const matchesDelivery = filters.deliveryCity === '' || 
      request.delivery_city.toLowerCase().includes(filters.deliveryCity.toLowerCase());

    const matchesUrgency = filters.urgency === 'all' || request.urgency === filters.urgency;

    return matchesSearch && matchesPickup && matchesDelivery && matchesUrgency;
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
              <Link href="/journeys" className="text-gray-600 hover:text-gray-900">
                Browse Journeys
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Delivery Requests</h1>
          <p className="text-gray-600">Find items to deliver along your route and earn money</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by city or item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Pickup city"
                value={filters.pickupCity}
                onChange={(e) => setFilters({ ...filters, pickupCity: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Delivery city"
                value={filters.deliveryCity}
                onChange={(e) => setFilters({ ...filters, deliveryCity: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All urgency</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilters({ pickupCity: '', deliveryCity: '', urgency: 'all' })}
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
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No requests found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Found {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/requests/${request.id}`)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {request.item_name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              request.urgency === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {request.urgency}
                            </span>
                            {request.is_international && (
                              <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700">
                                International
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        £{Number(request.offered_price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Offered</div>
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        You get: £{(Number(request.offered_price) * 0.95).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{request.pickup_city}</span>
                        <span className="text-gray-500">, {request.pickup_country}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex-1 text-right">
                        <span className="font-semibold text-gray-900">{request.delivery_city}</span>
                        <span className="text-gray-500">, {request.delivery_country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {request.item_description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      {request.item_weight_kg && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {request.item_weight_kg}kg
                        </span>
                      )}
                      {request.item_dimensions && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {request.item_dimensions}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                        {request.item_category?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Pickup: {new Date(request.preferred_pickup_date).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>Flexible until: {new Date(request.flexible_until).toLocaleDateString()}</span>
                  </div>

                  {/* Hooper Info */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {request.profiles.full_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{request.profiles.full_name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span>{request.profiles.rating.toFixed(1)}</span>
                          </div>
                          <span>•</span>
                          <span>{request.profiles.total_deliveries} requests</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/requests/${request.id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* International Warning */}
                  {request.is_international && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                          International delivery - customs compliance required
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

