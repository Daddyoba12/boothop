import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { reviewId, action, notes } = await req.json() as {
      reviewId: string;
      action: 'approve' | 'reject';
      notes?: string;
    };

    if (!reviewId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('aml_reviews')
      .update({
        status:      action === 'approve' ? 'approved' : 'rejected',
        reviewer_id: null, // session has email only; extend AppSessionPayload with UUID if needed
        notes:       notes ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AML Review Error]', err);
    return NextResponse.json({ error: 'Review action failed' }, { status: 500 });
  }
}
