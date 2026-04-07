'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Redirect old /kyc/[matchId] URLs to the new /kyc?matchId= pattern
export default function KycRedirect() {
  const params   = useParams();
  const router   = useRouter();
  const matchId  = params.matchId as string;

  useEffect(() => {
    if (matchId) {
      router.replace(`/kyc?matchId=${matchId}`);
    }
  }, [matchId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
    </div>
  );
}
