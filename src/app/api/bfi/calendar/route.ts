import { NextRequest, NextResponse } from 'next/server';
import { getTpPriceCalendar } from '@/lib/bfi/providers/travelpayouts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin      = (searchParams.get('origin')      ?? 'LHR').toUpperCase();
  const destination = (searchParams.get('destination') ?? 'LOS').toUpperCase();
  const month       = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);

  try {
    const result = await getTpPriceCalendar(origin, destination, month);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
