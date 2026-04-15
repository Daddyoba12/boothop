import { NextRequest, NextResponse } from 'next/server';
import { translateTripCities } from '@/lib/translation';

// Client-side endpoint — used by the homepage form before direct Supabase insert.
export async function POST(req: NextRequest) {
  let from = '', to = '';
  try {
    const body = await req.json();
    from = body.from ?? '';
    to   = body.to   ?? '';
    if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
    const result = await translateTripCities(from, to);
    return NextResponse.json(result);
  } catch {
    // Translation is non-critical — return originals so the form can still proceed
    return NextResponse.json({ fromEn: from, toEn: to, language: 'en', translated: false });
  }
}
