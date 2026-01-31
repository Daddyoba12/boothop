'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Package, 
  CheckCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { DeliveryMatch } from '@/lib/supabase';

type MatchWithDetails = DeliveryMatch & {
  journeys: {
    from_city: string;
    from_country: string;
    to_city: string;
    to_country: string;
    departure_date: string;
  };
  delivery_requests: {
    item_name: string;
    item_description: string;
    pickup_city: string;
    delivery_city: string;
  };
  booter_profile: {
    full_name: string;
    email: string;
  };
  hooper_profile: {
    full_name: string;
    email: string;
  };
};

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [match, setMatch] = useState<MatchWithDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'booter' | 'hooper' | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [params.id]);

  const fetchMatchDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('delivery_matches')
        .select(`
          *,
          journeys:journey_id (
            from_city,
            from_country,
            to_city,
            to_country,
            departure_date
          ),
          delivery_requests:request_id (
            item_name,
            item_description,
            pickup_city,
            delivery_city
          ),
          booter_profile:booter_id (
            full_name,
            email
          ),
          hooper_profile:hooper_id (
            full_name,
            email
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setMatch(data as MatchWithDetails);
      
      // Determine user type
      if (data.booter_id === user.id) {
        setUserType('booter');
      } else if (data.hooper_id === user.id) {
        setUserType('hooper');
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (confirmationType: 'booter_delivery' | 'hooper_receipt') => {
    if (!match || !currentUserId) return;

    setConfirmLoading(true);

    try {
      const updates: any = {};

      if (confirmationType === 'booter_delivery') {
        updates.booter_confirmed_delivery = true;
        updates.booter_confirmed_at = new Date().toISOString();
      } else {
        updates.hooper_confirmed_receipt = true;
        updates.hooper_confirmed_condition = true;
        updates.hooper_confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('delivery_matches')
        .update(updates)
        .eq('id', match.id);

      if (error) throw error;

      // Refresh match details
      await fetchMatchDetails();

      // Check if both confirmed
      const bothConfirmed = 
        (confirmationType === 'booter_delivery' ? true : match.booter_confirmed_delivery) &&
        (confirmationType === 'hooper_receipt' ? true : match.hooper_confirmed_receipt);

      if (bothConfirmed) {
        // Payment will be released automatically by database trigger
        alert('🎉 Delivery confirmed by both parties! Payment is being released.');
      }
    } catch (error: any) {
      console.error('Error confirming:', error);
      alert('Failed to confirm: ' + error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="h-16 w-16 text-blue-600 animate-bounce" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Match not found</p>
        </div>
      </div>
    );
  }

  const canConfirm = match.status === 'accepted' && match.payment_status === 'escrowed';
  const booterConfirmed = match.booter_confirmed_delivery;
  const hooperConfirmed = match.hooper_confirmed_receipt && match.hooper_confirmed_condition;
  const bothConfirmed = booterConfirmed && hooperConfirmed;

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
            <Link 
              href={userType === 'booter' ? '/booter-dashboard' : '/hooper-dashboard'} 
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className={`mb-6 rounded-xl p-6 ${
          match.status === 'completed' 
            ? 'bg-green-50 border-2 border-green-200'
            : match.status === 'in_transit'
            ? 'bg-blue-50 border-2 border-blue-200'
            : 'bg-yellow-50 border-2 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {match.status === 'completed' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Clock className="h-8 w-8 text-yellow-600" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 capitalize">
                Status: {match.status.replace('_', ' ')}
              </h2>
              <p className="text-gray-600">
                Payment Status: {match.payment_status}
              </p>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Details</h3>
          
          <div className="space-y-4">
            {/* Route */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Route</div>
                <div className="text-gray-600">
                  {match.delivery_requests.pickup_city} → {match.delivery_requests.delivery_city}
                </div>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">{match.delivery_requests.item_name}</div>
                <div className="text-gray-600">{match.delivery_requests.item_description}</div>
              </div>
            </div>

            {/* Departure */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">Departure Date</div>
                <div className="text-gray-600">
                  {new Date(match.journeys.departure_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Payment Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Agreed Price:</span>
              <span className="font-semibold">£{Number(match.agreed_price).toFixed(2)}</span>
            </div>
            
            {userType === 'hooper' && (
              <>
                <div className="flex justify-between text-blue-700">
                  <span>+ Service Fee ({match.hooper_fee_percentage}%):</span>
                  <span className="font-semibold">£{(Number(match.hooper_pays) - Number(match.agreed_price)).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>You Paid:</span>
                  <span className="text-blue-600">£{Number(match.hooper_pays).toFixed(2)}</span>
                </div>
              </>
            )}

            {userType === 'booter' && (
              <>
                <div className="flex justify-between text-red-700">
                  <span>- Service Fee ({match.booter_fee_percentage}%):</span>
                  <span className="font-semibold">£{(Number(match.agreed_price) - Number(match.booter_receives)).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>You Receive:</span>
                  <span className="text-green-600">£{Number(match.booter_receives).toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <div className="text-sm text-gray-600">
                Payment is held securely in escrow and will be released automatically when both parties confirm delivery completion.
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Section */}
        {canConfirm && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Delivery Confirmation Required
            </h3>

            <div className="space-y-4">
              {/* Booter Confirmation */}
              <div className={`p-4 rounded-lg border-2 ${
                booterConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {booterConfirmed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">Booter Confirmation</div>
                      <div className="text-sm text-gray-600">
                        {booterConfirmed 
                          ? `Confirmed by ${match.booter_profile.full_name}`
                          : `Waiting for ${match.booter_profile.full_name} to confirm delivery`
                        }
                      </div>
                    </div>
                  </div>
                  
                  {userType === 'booter' && !booterConfirmed && (
                    <button
                      onClick={() => handleConfirmation('booter_delivery')}
                      disabled={confirmLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {confirmLoading ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                  )}
                </div>
              </div>

              {/* Hooper Confirmation */}
              <div className={`p-4 rounded-lg border-2 ${
                hooperConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {hooperConfirmed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">Hooper Confirmation</div>
                      <div className="text-sm text-gray-600">
                        {hooperConfirmed 
                          ? `Confirmed by ${match.hooper_profile.full_name}`
                          : `Waiting for ${match.hooper_profile.full_name} to confirm receipt`
                        }
                      </div>
                    </div>
                  </div>
                  
                  {userType === 'hooper' && !hooperConfirmed && (
                    <button>    
                                              onClick={() => handleConfirmation('hooper_receipt')}
                      disabled={confirmLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {confirmLoading ? 'Confirming...' : 'Confirm Receipt'}
                    </button>
                  )}
                </div>
              </div>

              {/* Both Confirmed Message */}
              {bothConfirmed && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-green-900 mb-1">🎉 Delivery Complete!</div>
                      <div className="text-sm text-green-800">
                        Both parties have confirmed. Payment of £{Number(match.booter_receives).toFixed(2)} 
                        has been released to {match.booter_profile.full_name}.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              {!bothConfirmed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Dual Confirmation Required</p>
                      <p>
                        Payment will be released automatically once BOTH the Booter and Hooper confirm 
                        the delivery is complete. This protects both parties.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed Message */}
        {match.status === 'completed' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-900 mb-2">Delivery Completed!</h3>
              <p className="text-green-800 mb-4">
                Payment was released on {new Date(match.payment_released_at!).toLocaleDateString()}
              </p>
              <Link
                href={`/ratings/create?match=${match.id}`}
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Leave a Review
              </Link>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
          
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-gray-900 mb-1">
                {userType === 'booter' ? 'Hooper' : 'Booter'}
              </div>
              <div className="text-gray-600">
                {userType === 'booter' ? match.hooper_profile.full_name : match.booter_profile.full_name}
              </div>
            </div>

            <Link
              href={`/messages?match=${match.id}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <MessageSquare className="h-5 w-5" />
              Send Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
