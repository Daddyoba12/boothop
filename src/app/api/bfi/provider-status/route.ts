import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { bfiDb } from '@/lib/bfi/db';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = bfiDb();
  const { data: providers } = await db
    .from('bfi_provider_status')
    .select('*')
    .order('provider');

  return NextResponse.json({ providers: providers ?? [] });
}
