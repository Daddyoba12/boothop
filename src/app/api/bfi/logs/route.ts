import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { getRecentSearchRuns } from '@/lib/bfi/db';

export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '50', 10);
  const runs = await getRecentSearchRuns(limit);
  return NextResponse.json({ runs });
}
