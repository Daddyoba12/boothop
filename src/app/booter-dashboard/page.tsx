'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Plane, 
  TrendingUp, 
  Star, 
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Profile, Journey, DeliveryMatch } from '@/lib/supabase';

export default function BooterDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
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

      // Fetch journeys
      const { data: journeysData } = await supabase
        .from('journeys')
        .select('*')
        .eq('booter_id', user.id)
        .order('departure_date', { ascending: true });

      setJourneys(journeysData || []);

      // Fetch delivery matches
      const { data: matchesData } = await supabase
        .from('delivery_matches')
        .select('*')
        .eq('booter_id', user.id)
        .order('created_at', { ascending: false });

      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeJourneys = journeys.filter(j => j.status === 'active');
  const completedDeliveries = profile?.completed_deliveries || 0;
  const totalEarnings = matches
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => sum + Number(m.booter_receives), 0);
  const rating = profile?.rating || 0;

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
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
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
          <p className="text-gray-600">Manage your journeys and track your earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">+{activeJourneys.length - 1} from last month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeJourneys.length}</div>
            <div className="text-gray-600">Active Journeys</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">+3 from last month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{completedDeliveries}</div>
            <div className="text-gray-600">Completed Deliveries</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">+12% from last month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">£{totalEarnings.toFixed(2)}</div>
            <div className="text-gray-600">Total Earnings</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Based on {profile?.total_deliveries || 0} reviews</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{rating.toFixed(1)}</div>
            <div className="text-gray-600">Rating</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Link
                        href="/journeys/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            Post New Journey
          </Link>
          <Link
            href="/requests"
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition"
          >
            Browse Delivery Requests
          </Link>
          <Link
            href="/journeys"
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition"
          >
            View All Journeys
          </Link>
        </div>

        {/* Active Journeys */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your Active Journeys</h2>
              <Link href="/journeys" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {activeJourneys.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active journeys yet</p>
                <Link
                  href="/journeys/create"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5" />
                  Post Your First Journey
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeJourneys.slice(0, 3).map((journey) => (
                  <div
                    key={journey.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                    onClick={() => router.push(`/journeys/${journey.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plane className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {journey.from_city}, {journey.from_country} → {journey.to_city}, {journey.to_country}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Departure: {new Date(journey.departure_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        {journey.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{journey.available_space_kg}kg available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{journey.delivery_matches} matches</span>
                      </div>
                      {journey.price_per_delivery && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>£{journey.price_per_delivery} per delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Delivery Matches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Recent Delivery Matches</h2>
              <Link href="/matches" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No delivery matches yet</p>
                <p className="text-sm text-gray-500">
                  Matches will appear here when Hoopers request deliveries on your routes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.slice(0, 5).map((match) => (
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
                        <div className="text-lg font-bold text-green-600">
                          £{Number(match.booter_receives).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">You receive</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : match.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-700'
                          : match.status === 'accepted'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {match.status}
                      </span>

                      {match.status === 'accepted' && (
                        <div className="flex items-center gap-2 text-sm">
                          {match.booter_confirmed_delivery ? (
                            <span className="text-green-600">✓ You confirmed</span>
                          ) : (
                            <span className="text-orange-600">⚠ Awaiting your confirmation</span>
                          )}
                          {match.hooper_confirmed_receipt ? (
                            <span className="text-green-600">✓ Hooper confirmed</span>
                          ) : (
                            <span className="text-gray-500">○ Awaiting hooper</span>
                          )}
                        </div>
                      )}

                      {match.status === 'completed' && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Payment released
                        </span>
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

