'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth error:', error);
          setStatus('error');
          setMessage('Verification failed. Please try again.');
          return;
        }

        if (session) {
          // Check if there's pending trip data in localStorage
          const pendingTrip = localStorage.getItem('pendingTrip');
          
          if (pendingTrip) {
            setMessage('Saving your trip...');
            
            const tripData = JSON.parse(pendingTrip);
            
            // Save the trip
            const { error: insertError } = await supabase
              .from('trips')
              .insert([{
                from_city: tripData.from,
                to_city: tripData.to,
                travel_date: tripData.date,
                price: tripData.price ? Number(tripData.price) : null,
                weight: tripData.weight,
                user_id: session.user.id,
                type: tripData.mode,
              }]);

            if (insertError) {
              console.error('Trip save error:', insertError);
              setStatus('error');
              setMessage('Email verified, but failed to save trip. Please try again.');
              return;
            }

            // Clear pending trip
            localStorage.removeItem('pendingTrip');
            
            setStatus('success');
            setMessage('Trip registered successfully!');
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
              router.push('/intent');
            }, 2000);
          } else {
            // No pending trip, just verified email
            setStatus('success');
            setMessage('Email verified successfully!');

            setTimeout(() => {
              router.push('/intent');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage('No session found. Please try logging in again.');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Please wait</h1>
            <p className="text-white/60">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
            <p className="text-white/60">{message}</p>
            <p className="text-white/40 text-sm mt-4">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-white/60 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Go Back Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
            <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
