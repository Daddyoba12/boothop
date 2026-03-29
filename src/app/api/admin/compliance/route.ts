import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase.admin';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('compliance_requests')
      .select(`
        id,
        item,
        country,
        status,
        category,
        risk_score,
        action,
        admin_decision,
        admin_note,
        created_at,
        user_id,
        profiles ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch compliance requests';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
