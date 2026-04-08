import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session     = getBizSession(cookieStore);

  if (!session?.email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Job ID required.' }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // Verify the job belongs to this user and is cancellable
  const { data: job } = await supabase
    .from('business_jobs')
    .select('id, status, email')
    .eq('id', id)
    .single();

  if (!job || job.email !== session.email) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (['delivered', 'cancelled', 'failed', 'in_transit'].includes(job.status)) {
    return NextResponse.json({ error: 'This job cannot be cancelled at its current stage. Please contact support.' }, { status: 400 });
  }

  await supabase
    .from('business_jobs')
    .update({ status: 'cancelled' })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}
