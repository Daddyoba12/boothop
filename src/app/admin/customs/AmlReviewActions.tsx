'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AmlReviewActions({ reviewId }: { reviewId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [done, setDone]       = useState<'approved' | 'rejected' | null>(null);

  async function submit(action: 'approve' | 'reject') {
    setLoading(action);
    try {
      const res = await fetch('/api/admin/customs/aml-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });
      if (res.ok) setDone(action === 'approve' ? 'approved' : 'rejected');
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return (
      <span className={`text-sm font-semibold ${done === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
        {done === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => submit('approve')}
        disabled={!!loading}
        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' && <Loader2 className="h-3 w-3 animate-spin" />}
        Approve
      </button>
      <button
        onClick={() => submit('reject')}
        disabled={!!loading}
        className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {loading === 'reject' && <Loader2 className="h-3 w-3 animate-spin" />}
        Reject
      </button>
    </div>
  );
}
