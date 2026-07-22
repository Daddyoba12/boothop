import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email, agreed_price,
      compliance_locked_at, compliance_review_started_at, sealed_at,
      declaration_id,
      sender_trip:sender_trip_id(from_city, to_city, travel_date),
      item_declarations!declaration_id(
        id, declaration_status, item_description, item_category,
        declared_value, declared_currency, declared_weight_kg,
        contains_electronics, contains_medication, contains_food,
        contains_liquids, contains_currency, contains_jewellery,
        contains_documents, contains_clothing, contains_hazardous, contains_weapons,
        proof_of_ownership_url, version, risk_score,
        submitted_at, reviewed_at, reviewed_by, review_note
      )
    `)
    .in('status', ['locked_pending_compliance', 'compliance_in_progress', 'compliance_rejected', 'compliance_timeout'])
    .order('compliance_locked_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
