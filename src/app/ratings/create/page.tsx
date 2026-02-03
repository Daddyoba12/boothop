'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Star,
  MessageSquare,
  Users,
  CheckCircle
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

export default function CreateRatingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const matchId = searchParams.get('match');
  
  const [match, setMatch] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [userType, setUserType] = useState<'booter' | 'hooper' | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 0,
    communicationRating: 0,
    reliabilityRating: 0,
    review: '',
  });

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: matchData, error } = await supabase
        .from('delivery_matches')
        .select(`
          *,
          booter_profile:booter_id (
            id,
            full_name,
            rating
          ),
          hooper_profile:hooper_id (
            id,
            full_name,
            rating
          )
        `)
        .eq('id', matchId)
        .single();

      if (error || !matchData) {
        throw new Error('Match not found');
      }

      setMatch(matchData);

      // Determine user type and other user
      if (matchData.booter_id === user.id) {
        setUserType('booter');
        setOtherUser(matchData.hooper_profile);
      } else {
        setUserType('hooper');
        setOtherUser(matchData.booter_profile);
      }

      // Check if already rated
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('match_id', matchId)
        .eq('reviewer_id', user.id)
        .single();

      if (existingRating) {
        alert('You have already rated this delivery');
        router.push(`/matches/${matchId}`);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      alert('Please select an overall rating');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ratings')
        .insert({
          match_id: matchId,
          reviewer_id: user.id,
          reviewee_id: otherUser.id,
          rating: formData.rating,
          communication_rating: formData.communicationRating || null,
          reliability_rating: formData.reliabilityRating || null,
          review: formData.review.trim() || null,
        });

      if (error) throw error;

      alert('Thank you for your review!');
      router.push(`/matches/${matchId}`);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition ${
                star <= value
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="h-16 w-16 text-blue-600 animate-bounce" />
      </div>
    );
  }

  if (!match || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Match not found</p>
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
            <Link href={`/matches/${matchId}`} className="text-gray-600 hover:text-gray-900">
              ← Back to Match
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 rounded-full">
                <Star className="h-12 w-12 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Experience</h1>
            <p className="text-gray-600">Help us build a trusted community</p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {otherUser.full_name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{otherUser.full_name}</div>
                <div className="text-sm text-gray-600">
                  Current Rating: {otherUser.rating.toFixed(1)} ⭐
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <StarRating
              value={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              label="Overall Rating *"
            />

            {/* Communication Rating */}
            <StarRating
              value={formData.communicationRating}
              onChange={(rating) => setFormData({ ...formData, communicationRating: rating })}
              label="Communication"
            />

            {/* Reliability Rating */}
            <StarRating
              value={formData.reliabilityRating}
              onChange={(rating) => setFormData({ ...formData, reliabilityRating: rating })}
              label="Reliability"
            />

            {/* Written Review */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Written Review (Optional)
              </label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Share your experience with this delivery..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

