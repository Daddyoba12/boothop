'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Send, 
  TrendingDown, 
  CheckCircle,
  Clock,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Profile, DeliveryRequest, DeliveryMatch } from '@/lib/supabase';

export default function HooperDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [matches, setMatches] = useState<DeliveryMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch delivery requests
      const { data: requestsData } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('hooper_id', user.id)
        .order('preferred_pickup_date', { ascending: true });

      setRequests(requestsData || []);

      // Fetch delivery matches
      const { data: matchesData } = await supabase
        .from('delivery_matches')
        .select('*')
        .eq('hooper_id', user.id)
        .order('created_at', { ascending: false });

      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeRequests = requests.filter(r => r.status === 'open');
  const pendingMatches = matches.filter(m => m.status === 'pending' || m.status === 'accepted');
  const completedDeliveries = matches.filter(m => m.status === 'completed').length;
  
  // Calculate money saved vs traditional shipping
  const moneySaved = matches
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => {
      // Assume traditional shipping would cost 2x the agreed price
      const traditionalCost = Number(m.agreed_price) * 2;
      const actualCost = Number(m.hooper_pays);
      return sum + (traditionalCost - actualCost);
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-blue-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">BootHop</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About Us
              </Link>
              <Link href="/journeys" className="text-gray-600 hover:text-gray-900">
                Browse Journeys
              </Link>
              <Link href="/requests" className="text-gray-600 hover:text-gray-900">
                View Requests
              </Link>
              <Link href="/messages" className="text-gray-600 hover:text-gray-900 relative">
                <MessageSquare className="h-5 w-5" />
              </Link>
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {profile?.full_name.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                  <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Profile Settings
                  </Link>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name}! 👋
          </h1>
          <p className="text-gray-600">Manage your delivery requests and browse available travelers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Currently in progress</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeRequests.length}</div>
            <div className="text-gray-600">Active Requests</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Awaiting confirmation</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{pendingMatches.length}</div>
            <div className="text-gray-600">Pending Matches</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Successfully delivered</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{completedDeliveries}</div>
            <div className="text-gray-600">Completed Deliveries</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">vs traditional shipping</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">£{moneySaved.toFixed(2)}</div>
            <div className="text-gray-600">Money Saved</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/requests/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            Post Delivery Request
          </Link>
          <Link
            href="/journeys"
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition"
          >
            Browse Available Journeys
          </Link>
          <Link
            href="/requests"
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition"
          >
            View All Your Requests
          </Link>
        </div>

        {/* Active Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your Active Requests</h2>
              <Link href="/requests" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {activeRequests.length === 0 ? (
              <div className="text-center py-12">
                <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active requests yet</p>
                <Link
                  href="/requests/create"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => router.push(`/requests/${request.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.item_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.pickup_city} → {request.delivery_city}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          £{Number(request.offered_price).toFixed(2)}
                        </div>
                        <span className="text-xs text-gray-500">Offered</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        request.urgency === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {request.urgency}
                      </span>
                      <span className="text-gray-600">
                        Pickup: {new Date(request.preferred_pickup_date).toLocaleDateString()}
                      </span>
                      {request.is_international && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          International
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Matches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Pending Matches</h2>
              <Link href="/matches" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {pendingMatches.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No pending matches</p>
                <p className="text-sm text-gray-500">
                  Matches will appear here when Booters accept your requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => router.push(`/matches/${match.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Delivery Match
                        </h3>
                        <p className="text-sm text-gray-600">
                          Agreed Price: £{Number(match.agreed_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          £{Number(match.hooper_pays).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">You pay (inc. 3% fee)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.payment_status === 'escrowed'
                          ? 'bg-blue-100 text-blue-700'
                          : match.payment_status === 'released'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {match.payment_status}
                      </span>

                      {match.status === 'accepted' && (
                        <div className="flex items-center gap-2 text-sm">
                          {match.hooper_confirmed_receipt ? (
                            <span className="text-green-600">✓ You confirmed</span>
                          ) : (
                            <span className="text-orange-600">⚠ Awaiting your confirmation</span>
                          )}
                          {match.booter_confirmed_delivery ? (
                            <span className="text-green-600">✓ Booter confirmed</span>
                          ) : (
                            <span className="text-gray-500">○ Awaiting booter</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
