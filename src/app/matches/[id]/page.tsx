'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  ArrowLeft, Check, X, MapPin, Calendar, DollarSign, 
  User, Shield, AlertCircle, Loader2, Package, Clock,
  MessageSquare, CheckCircle, Sparkles, Star, Award
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MatchDetails = {
  id: string;
  status: string;
  payment_status: string;
  sender_accepted: boolean;
  traveler_accepted: boolean;
  agreed_price: number;
  hooper_pays: number;
  booter_receives: number;
  hooper_fee_percentage: number;
  booter_fee_percentage: number;
  booter_confirmed_delivery: boolean;
  hooper_confirmed_receipt: boolean;
  hooper_confirmed_condition: boolean;
  booter_confirmed_at: string | null;
  hooper_confirmed_at: string | null;
  payment_released_at: string | null;
  sender_trip: {
    from_city: string;
    to_city: string;
    travel_date: string;
    price: number;
    user_id: string;
  };
  traveler_trip: {
    from_city: string;
    to_city: string;
    travel_date: string;
    price: number;
    user_id: string;
  };
  sender_profile: {
    full_name: string;
    email: string;
  };
  traveler_profile: {
    full_name: string;
    email: string;
  };
};

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<'sender' | 'traveler' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadMatch();
    loadUser();
  }, [matchId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadMatch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          sender_trip:sender_trip_id(
            from_city,
            to_city,
            travel_date,
            price,
            user_id
          ),
          traveler_trip:traveler_trip_id(
            from_city,
            to_city,
            travel_date,
            price,
            user_id
          ),
          sender_profile:sender_trip_id(user:user_id(full_name, email)),
          traveler_profile:traveler_trip_id(user:user_id(full_name, email))
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;

      setMatch(data);

      if (data.sender_trip.user_id === user.id) {
        setRole('sender');
      } else if (data.traveler_trip.user_id === user.id) {
        setRole('traveler');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading match:', error);
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser || !role) {
      alert('Please login to accept this match');
      return;
    }

    setProcessing(true);

    try {
      const updateField = role === 'sender' ? 'sender_accepted' : 'traveler_accepted';
      
      const { error } = await supabase
        .from('matches')
        .update({ [updateField]: true })
        .eq('id', matchId);

      if (error) throw error;

      const updatedMatch = { ...match, [updateField]: true };
      
      if (updatedMatch.sender_accepted && updatedMatch.traveler_accepted) {
        await initiatePayment();
      } else {
        alert('✅ Match accepted! Waiting for the other party to accept.');
        loadMatch();
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      alert('Failed to accept match');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this match?')) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', matchId);

      if (error) throw error;

      alert('Match declined');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error declining match:', error);
      alert('Failed to decline match');
    } finally {
      setProcessing(false);
    }
  };

  const initiatePayment = async () => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId,
          amount: match?.agreed_price || match?.sender_trip.price
        })
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment');
    }
  };

  const handleConfirmation = async (confirmationType: 'booter_delivery' | 'hooper_receipt') => {
    if (!match || !currentUser) return;

    setProcessing(true);

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
        .from('matches')
        .update(updates)
        .eq('id', match.id);

      if (error) throw error;

      await loadMatch();

      const bothConfirmed = 
        (confirmationType === 'booter_delivery' ? true : match.booter_confirmed_delivery) &&
        (confirmationType === 'hooper_receipt' ? true : match.hooper_confirmed_receipt);

      if (bothConfirmed) {
        alert('🎉 Delivery confirmed by both parties! Payment is being released.');
      }
    } catch (error: any) {
      console.error('Error confirming:', error);
      alert('Failed to confirm: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="relative z-10 text-center">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70 font-medium">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Match Not Found</h1>
          <p className="text-white/60 mb-6">This match doesn't exist or you don't have access to it.</p>
          <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const isSender = role === 'sender';
  const myAccepted = isSender ? match.sender_accepted : match.traveler_accepted;
  const theirAccepted = isSender ? match.traveler_accepted : match.sender_accepted;
  const bothAccepted = match.sender_accepted && match.traveler_accepted;
  
  const canConfirm = match.status === 'accepted' && match.payment_status === 'escrowed';
  const booterConfirmed = match.booter_confirmed_delivery;
  const hooperConfirmed = match.hooper_confirmed_receipt && match.hooper_confirmed_condition;
  const deliveryComplete = booterConfirmed && hooperConfirmed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 relative overflow-hidden">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-50 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 text-white hover:text-blue-300 transition-colors group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
          
          <div className={`px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg ${
            match.status === 'completed' ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border border-green-400/50' :
            match.status === 'in_transit' ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-200 border border-blue-400/50' :
            match.status === 'accepted' ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border border-green-400/50' :
            match.status === 'pending' ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border border-yellow-400/50' :
            'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-200 border border-red-400/50'
          }`}>
            <Sparkles className="w-4 h-4" />
            {match.status === 'completed' ? 'Completed' :
             match.status === 'in_transit' ? 'In Transit' :
             match.status === 'accepted' ? 'Accepted' :
             match.status === 'pending' ? 'Pending' :
             'Declined'}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        
        {/* HERO TITLE SECTION */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
          
          <div className="inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 mx-auto">
              {match.status === 'completed' ? (
                <Award className="w-12 h-12 text-white" />
              ) : deliveryComplete ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : bothAccepted ? (
                <Shield className="w-12 h-12 text-white" />
              ) : (
                <Package className="w-12 h-12 text-white" />
              )}
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {match.status === 'completed' ? '🎉 Delivery Completed!' :
               deliveryComplete ? '🎉 Both Confirmed!' :
               bothAccepted ? '✅ Match Confirmed!' : 
               '🤝 Match Found'}
            </span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto leading-relaxed">
            {match.status === 'completed' 
              ? 'Payment has been released to the traveler'
              : deliveryComplete
              ? 'Payment is being processed'
              : bothAccepted 
              ? match.payment_status === 'escrowed' ? 'Payment secured. Ready for delivery.' : 'Proceed to payment.'
              : 'Review the details and accept if you\'re ready to proceed.'
            }
          </p>
        </div>

        {/* PREMIUM MATCH DETAILS CARDS */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* SENDER CARD */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-all duration-500">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    Sender
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Hooper</span>
                  </h3>
                  <p className="text-white/60">Needs delivery</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm mb-1">Route</p>
                    <p className="text-white font-bold text-lg">
                      {match.sender_trip.from_city} → {match.sender_trip.to_city}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm mb-1">Delivery Date</p>
                    <p className="text-white font-semibold">
                      {new Date(match.sender_trip.travel_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {role === 'sender' && (
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl">
                    <p className="text-blue-300 font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      This is your delivery request
                    </p>
                  </div>
                )}

                {match.sender_accepted && (
                  <div className="flex items-center gap-2 text-green-400 font-semibold p-3 bg-green-500/10 rounded-xl border border-green-400/30">
                    <CheckCircle className="w-5 h-5" />
                    <span>Sender accepted</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TRAVELER CARD */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-all duration-500">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    Traveler
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Booter</span>
                  </h3>
                  <p className="text-white/60">Can carry package</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm mb-1">Route</p>
                    <p className="text-white font-bold text-lg">
                      {match.traveler_trip.from_city} → {match.traveler_trip.to_city}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm mb-1">Travel Date</p>
                    <p className="text-white font-semibold">
                      {new Date(match.traveler_trip.travel_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {role === 'traveler' && (
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl">
                    <p className="text-blue-300 font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      This is your journey
                    </p>
                  </div>
                )}

                {match.traveler_accepted && (
                  <div className="flex items-center gap-2 text-green-400 font-semibold p-3 bg-green-500/10 rounded-xl border border-green-400/30">
                    <CheckCircle className="w-5 h-5" />
                    <span>Traveler accepted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT BREAKDOWN */}
        {match.agreed_price && (
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">Payment Breakdown</h3>
              </div>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                  <span className="text-white/70 font-medium">Agreed Price:</span>
                  <span className="font-bold text-white text-2xl">£{Number(match.agreed_price).toFixed(2)}</span>
                </div>
                
                {role === 'sender' && match.hooper_pays && (
                  <>
                    <div className="flex justify-between items-center p-4 bg-blue-500/10 rounded-2xl border border-blue-400/30">
                      <span className="text-blue-300 font-medium">+ Service Fee ({match.hooper_fee_percentage}%):</span>
                      <span className="font-semibold text-blue-300">£{(Number(match.hooper_pays) - Number(match.agreed_price)).toFixed(2)}</span>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-lg">You Pay:</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          £{Number(match.hooper_pays).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {role === 'traveler' && match.booter_receives && (
                  <>
                    <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-2xl border border-red-400/30">
                      <span className="text-red-300 font-medium">- Service Fee ({match.booter_fee_percentage}%):</span>
                      <span className="font-semibold text-red-300">£{(Number(match.agreed_price) - Number(match.booter_receives)).toFixed(2)}</span>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-lg">You Receive:</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          £{Number(match.booter_receives).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {match.payment_status === 'escrowed' && (
                  <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-6 h-6 text-green-400" />
                      <span className="font-bold text-green-300 text-lg">Payment Secured in Escrow</span>
                    </div>
                    <p className="text-green-200/80 leading-relaxed">
                      Funds are safely held by Stripe and will be released automatically when both parties confirm delivery completion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY CONFIRMATION SECTION - FIXED */}
        {canConfirm && (
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl p-8 shadow-2xl">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">Delivery Confirmation Required</h3>
              </div>

              <div className="space-y-6">
                {/* Traveler Confirmation - FIXED */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${
                  booterConfirmed 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' 
                    : 'bg-white/5 border-white/20 hover:border-white/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {booterConfirmed ? (
                        <CheckCircle className="h-10 w-10 text-green-400" />
                      ) : (
                        <Clock className="h-10 w-10 text-yellow-400 animate-pulse" />
                      )}
                      <div>
                        <div className="font-bold text-white text-xl mb-1">Traveler (Booter) Confirmation</div>
                        <div className="text-white/70">
                          {booterConfirmed 
                            ? `✅ Confirmed at ${new Date(match.booter_confirmed_at!).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : 'Waiting for delivery confirmation'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {role === 'traveler' && !booterConfirmed && (
                      <button
                        onClick={() => handleConfirmation('booter_delivery')}
                        disabled={processing}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 flex items-center gap-3 hover:scale-105"
                      >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                </div>

                {/* Sender Confirmation */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${
                  hooperConfirmed 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' 
                    : 'bg-white/5 border-white/20 hover:border-white/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {hooperConfirmed ? (
                        <CheckCircle className="h-10 w-10 text-green-400" />
                      ) : (
                        <Clock className="h-10 w-10 text-yellow-400 animate-pulse" />
                      )}
                      <div>
                        <div className="font-bold text-white text-xl mb-1">Sender (Hooper) Confirmation</div>
                        <div className="text-white/70">
                          {hooperConfirmed 
                            ? `✅ Confirmed at ${new Date(match.hooper_confirmed_at!).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : 'Waiting for receipt confirmation'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {role === 'sender' && !hooperConfirmed && (
                      <button
                        onClick={() => handleConfirmation('hooper_receipt')}
                        disabled={processing}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-green-500/50 transition-all disabled:opacity-50 flex items-center gap-3 hover:scale-105"
                      >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                        Confirm Receipt
                      </button>
                    )}
                  </div>
                </div>

                {deliveryComplete && (
                  <div className="p-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50 flex-shrink-0">
                        <CheckCircle className="h-9 w-9 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-green-300 text-2xl mb-2 flex items-center gap-2">
                          🎉 Delivery Complete!
                          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        </div>
                        <div className="text-green-200/90 text-lg leading-relaxed">
                          Both parties have confirmed. Payment of{' '}
                          <span className="font-bold text-green-300">£{Number(match.booter_receives).toFixed(2)}</span>{' '}
                          is being released to the traveler.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!deliveryComplete && (
                  <div className="p-6 bg-blue-500/10 border border-blue-400/30 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="text-blue-200/90 leading-relaxed">
                        <p className="font-bold mb-2 text-blue-300">🔒 Dual Confirmation Required</p>
                        <p>
                          Payment will be released automatically once BOTH the traveler and sender confirm 
                          the delivery is complete. This protects both parties and ensures safe transactions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        {role && !myAccepted && match.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <button
              onClick={handleDecline}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400/50 text-red-300 py-5 rounded-2xl font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xl hover:scale-105 shadow-lg"
            >
              {processing ? <Loader2 className="w-7 h-7 animate-spin" /> : <X className="w-7 h-7" />}
              Decline Match
            </button>

            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white py-5 rounded-2xl font-bold hover:shadow-2xl hover:shadow-green-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xl hover:scale-105"
            >
              {processing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Check className="w-7 h-7" />}
              Accept Match
            </button>
          </div>
        )}

        {/* WAITING STATE */}
        {myAccepted && !theirAccepted && (
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-400/30 rounded-3xl p-12 text-center">
              <Loader2 className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-spin" />
              <h3 className="text-3xl font-bold text-white mb-3">
                Waiting for {isSender ? 'Traveler' : 'Sender'}
              </h3>
              <p className="text-white/70 text-xl">We'll notify you once they accept the match.</p>
            </div>
          </div>
        )}

        {/* PAYMENT CTA */}
        {bothAccepted && match.status === 'pending' && isSender && !match.payment_status && (
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative text-center">
              <button
                onClick={initiatePayment}
                disabled={processing}
                className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white px-16 py-6 rounded-2xl font-bold text-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 disabled:opacity-50 flex items-center justify-center gap-4 mx-auto shadow-2xl"
              >
                {processing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Shield className="w-8 h-8" />}
                Proceed to Secure Payment
                <Sparkles className="w-6 h-6" />
              </button>
              <p className="text-white/60 text-lg mt-6">
                Payment will be held in escrow until delivery is confirmed by both parties
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
