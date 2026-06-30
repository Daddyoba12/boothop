import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function session() {
  const store = await cookies();
  return getCommanderSession(store);
}

// POST — assign a track to this client
export async function POST(req: NextRequest) {
  const s = await session();
  if (!s) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { trackId } = await req.json();
  if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

  const db = createSupabaseAdminClient();

  // Upsert (idempotent)
  const { error } = await db.from('client_music').upsert(
    { client_id: s.clientId, track_id: trackId },
    { onConflict: 'client_id,track_id' }
  );

  if (error) return NextResponse.json({ error: 'Failed to assign track' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a track from this client
export async function DELETE(req: NextRequest) {
  const s = await session();
  if (!s) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { trackId } = await req.json();
  if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

  const db = createSupabaseAdminClient();

  const { error } = await db.from('client_music')
    .delete()
    .eq('client_id', s.clientId)
    .eq('track_id', trackId);

  if (error) return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
