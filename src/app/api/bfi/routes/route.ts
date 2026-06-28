import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { getAllRoutes, toggleRoute, bfiDb } from '@/lib/bfi/db';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = bfiDb();
  const { data: routes, error } = await db
    .from('bfi_routes')
    .select(`
      *,
      origin_airport:bfi_airports!bfi_routes_origin_fkey(name, city, country),
      dest_airport:bfi_airports!bfi_routes_destination_fkey(name, city, country),
      stats:bfi_route_stats(*)
    `)
    .order('priority', { ascending: false });

  if (error) {
    // Fallback to simple query if joins aren't set up yet
    const simple = await getAllRoutes();
    return NextResponse.json({ routes: simple });
  }

  return NextResponse.json({ routes: routes ?? [] });
}

export async function PATCH(request: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, enabled } = await request.json() as { id: string; enabled: boolean };
  if (!id || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'id and enabled required' }, { status: 400 });
  }

  await toggleRoute(id, enabled);
  return NextResponse.json({ ok: true });
}
