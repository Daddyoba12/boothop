'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooters: 0,
    totalHoopers: 0,
    totalJourneys: 0,
    totalRequests: 0,
    totalMatches: 0,
    completedDeliveries: 0,
    totalRevenue: 0,
    activeMatches: 0,
    pendingVerifications: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // TODO: Add admin role check in profiles table
      // For now, we'll just fetch stats
      await fetchStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Booters
      const { count: totalBooters } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'booter');

      // Hoopers
      const { count: totalHoopers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'hooper');

      // Journeys
      const { count: totalJourneys } = await supabase
        .from('journeys')
        .select('*', { count: 'exact', head: true });

      // Requests
      const { count: totalRequests } = await supabase
        .from('delivery_requests')
        .select('*', { count: 'exact', head: true });

      // Matches
      const { count: totalMatches } = await supabase
        .from('delivery_matches')
        .select('*', { count: 'exact', head: true });

      // Completed deliveries
      const { count: completedDeliveries } = await supabase
        .from('delivery_matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Active matches
      const { count: activeMatches } = await supabase
        .from('delivery_matches')
        .select('*', { count: 'exact', head: true })
        .in('status', ['accepted', 'in_transit']);

      // Pending verifications
      const { count: pendingVerifications } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Calculate revenue (sum of platform fees from completed matches)
      const { data: completedMatches } = await supabase
        .from('delivery_matches')
        .select('platform_fee')
        .eq('status', 'completed');

      const totalRevenue = completedMatches?.reduce(
        (sum, match) => sum + Number(match.platform_fee),
        0
      ) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalBooters: totalBooters || 0,
        totalHoopers: totalHoopers || 0,
        totalJourneys: totalJourneys || 0,
        totalRequests: totalRequests || 0,
        totalMatches: totalMatches || 0,
        completedDeliveries: completedDeliveries || 0,
        totalRevenue,
        activeMatches: activeMatches || 0,
        pendingVerifications: pendingVerifications || 0,
      });

      // Fetch recent activity
      await fetchRecentActivity();
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('delivery_matches')
        .select(`
          id,
          status,
          agreed_price,
          created_at,
          delivery_requests:request_id (
            item_name
          ),
          booter_profile:booter_id (
            full_name
          ),
          hooper_profile:hooper_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="h-16 w-16 text-blue-600 animate-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <span className="text-2xl font-bold text-gray-900">BootHop</span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  ADMIN
                </span>
              </div>
            </div>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              View Site
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
            <div className="text-gray-600 text-sm">Total Users</div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.totalBooters} Booters • {stats.totalHoopers} Hoopers
            </div>
          </div>

          {/* Total Matches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalMatches}</div>
            <div className="text-gray-600 text-sm">Total Matches</div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.completedDeliveries} completed
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              £{stats.totalRevenue.toFixed(2)}
            </div>
            <div className="text-gray-600 text-sm">Total Revenue</div>
            <div className="mt-2 text-xs text-gray-500">
              Platform fees collected
            </div>
          </div>

          {/* Active Matches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeMatches}</div>
            <div className="text-gray-600 text-sm">Active Deliveries</div>
            <div className="mt-2 text-xs text-gray-500">
              In progress right now
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalJourneys}</div>
                <div className="text-gray-600 text-sm">Total Journeys</div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalRequests}</div>
                <div className="text-gray-600 text-sm">Total Requests</div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</div>
                <div className="text-gray-600 text-sm">Pending Verifications</div>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Match ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Booter</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hooper</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {activity.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm">{activity.delivery_requests.item_name}</td>
                      <td className="py-3 px-4 text-sm">{activity.booter_profile.full_name}</td>
                      <td className="py-3 px-4 text-sm">{activity.hooper_profile.full_name}</td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        £{Number(activity.agreed_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : activity.status === 'accepted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/admin/users"
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-blue-500 transition text-center"
          >
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </Link>

          <Link
            href="/admin/matches"
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-green-500 transition text-center"
          >
            <BarChart className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">View Matches</h3>
            <p className="text-sm text-gray-600">Monitor all delivery matches</p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-purple-500 transition text-center"
          >
            <Settings className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Platform Settings</h3>
            <p className="text-sm text-gray-600">Configure platform options</p>
          </Link>

          <Link
            href="/admin/compliance"
            className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6 hover:border-amber-500 transition text-center"
          >
            <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Compliance Queue</h3>
            <p className="text-sm text-gray-600">Review flagged shipments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

