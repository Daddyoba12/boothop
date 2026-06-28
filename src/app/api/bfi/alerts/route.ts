import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { getAlerts, markAlertRead, markAllAlertsRead } from '@/lib/bfi/db';

export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '50', 10);
  const alerts = await getAlerts(limit);
  return NextResponse.json({ alerts });
}

export async function PATCH(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, markAll } = await request.json() as { id?: string; markAll?: boolean };

  if (markAll) {
    await markAllAlertsRead();
  } else if (id) {
    await markAlertRead(id);
  } else {
    return NextResponse.json({ error: 'id or markAll required' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
