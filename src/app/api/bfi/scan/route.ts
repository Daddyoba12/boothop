import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { runScan } from '@/lib/bfi/search-engine';

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await runScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
