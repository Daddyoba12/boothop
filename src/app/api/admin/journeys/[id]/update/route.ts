import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_FIELDS = ['status', 'weight', 'price', 'travel_date'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { field, value, reason } = await request.json();

  if (!field || value === undefined || value === null || !reason?.trim()) {
    return NextResponse.json(
      { error: 'field, value, and reason are all required' },
      { status: 400 }
    );
  }

  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json(
      { error: `field must be one of: ${ALLOWED_FIELDS.join(', ')}` },
      { status: 400 }
    );
  }

  if (reason.trim().length < 10) {
    return NextResponse.json(
      { error: 'Reason must be at least 10 characters' },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { [field]: value };
  if (field === 'weight' || field === 'price') update[field] = Number(value);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('trips').update(update).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, field, value, reason });
}
