import { NextResponse } from 'next/server';
import { runScan } from '@/lib/bfi/search-engine';

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
    ?? new URL(request.url).searchParams.get('cronSecret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
