import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('item_categories')
      .select('id, name, display_name, risk_level, requires_invoice, requires_enhanced_id')
      .order('display_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ categories: data });
  } catch (err) {
    console.error('[Customs Categories Error]', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
