import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/auth/code';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email || '');
    if (!email || !email.includes('@')) {
      return NextResponse.json({ trips: [] });
    }
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from('trips')
      .select('id, type, from_city, to_city, travel_date, status, weight')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);
    return NextResponse.json({ trips: data || [] });
  } catch {
    return NextResponse.json({ trips: [] });
  }
}
