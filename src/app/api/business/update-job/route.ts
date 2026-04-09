import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);

    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, pickup, dropoff, description, delivery_date, expected_delivery_date, urgency } = body;

    if (!id) {
      return NextResponse.json({ error: 'Job ID required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify the job belongs to this user and is still editable
    const { data: job } = await supabase
      .from('business_jobs')
      .select('id, status, email')
      .eq('id', id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    if (job.email !== session.email) {
      return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
    }

    if (!['pending', 'assigned'].includes(job.status)) {
      return NextResponse.json({ error: 'Job cannot be amended at this stage.' }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (pickup)                  updates.pickup                  = pickup;
    if (dropoff)                 updates.dropoff                 = dropoff;
    if (description !== undefined) updates.description           = description || null;
    if (urgency)                 updates.urgency                 = urgency;
    if (delivery_date !== undefined) updates.delivery_date       = delivery_date || null;
    if (expected_delivery_date !== undefined) updates.expected_delivery_date = expected_delivery_date || null;

    const { error } = await supabase
      .from('business_jobs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('business/update-job error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
