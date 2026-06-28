import { NextRequest, NextResponse } from 'next/server';
import { getTpCheapestMonths } from '@/lib/bfi/providers/travelpayouts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin      = (searchParams.get('origin')      ?? 'LHR').toUpperCase();
  const destination = (searchParams.get('destination') ?? 'LOS').toUpperCase();

  try {
    const result = await getTpCheapestMonths(origin, destination);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
