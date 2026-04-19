import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { translateTripCities } from '@/lib/translation';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { from, to, date, weight, price, mode, route_type } = body;

    if (!from || !to || !date || !weight || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const priceNum = parseFloat(String(price || '0').replace(/[^0-9.]/g, '')) || null;

    // Auto-translate from/to if non-English (best-effort — never blocks trip creation)
    const translation = await translateTripCities(from, to).catch(() => ({
      fromEn: from, toEn: to, language: 'en', translated: false,
    }));

    const supabase = createSupabaseAdminClient();

    // Try inserting with all columns; fall back to core fields if columns don't exist yet
    const coreInsert = {
      email:       session.email,
      user_id:     null,
      type:        mode,
      from_city:   from,
      to_city:     to,
      travel_date: date,
      weight:      weight ?? null,
      price:       priceNum,
      status:      'active',
    };

    const { error: tripErr } = await supabase.from('trips').insert({
      ...coreInsert,
      from_city_en: translation.fromEn,
      to_city_en:   translation.toEn,
      language:     translation.language,
      translated:   translation.translated,
      route_type:   route_type ?? null,
    });

    // If columns don't exist yet, retry with core fields only
    if (tripErr) {
      if (tripErr.message?.includes('column') || tripErr.code === 'PGRST204') {
        const { error: fallbackErr } = await supabase.from('trips').insert(coreInsert);
        if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
      } else {
        return NextResponse.json({ error: tripErr.message }, { status: 500 });
      }
    }

    // Fire auto-match (best-effort, non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    if (appUrl && process.env.CRON_SECRET) {
      fetch(`${appUrl}/api/cron/auto-match`, {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, redirectTo: '/dashboard?listing=new' });
  } catch (error) {
    console.error('trips/create error', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
