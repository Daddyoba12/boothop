import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const SB_URL = 'https://zwgngbzbdvnrdnanjded.supabase.co';

export async function GET(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json([], { status: 401 });

  const forClient = req.nextUrl.searchParams.get('forClient') || '';
  const hours = parseInt(req.nextUrl.searchParams.get('hours') || '48', 10);
  const slug = (session.isSuper && forClient) ? forClient : session.slug;

  const db = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);

  // Check both slug paths for backward compatibility (ginspired + g-inspired)
  const folders = [`pipeline/${slug}`];
  if (slug === 'ginspired') folders.push('pipeline/g-inspired');

  const results: { url: string; filename: string; created_at: string }[] = [];

  for (const folder of folders) {
    const { data } = await db.storage.from('promo-videos').list(folder, {
      limit: 50,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (!data) continue;
    for (const file of data) {
      if (!file.name.endsWith('.mp4')) continue;
      const created = new Date(file.created_at || 0);
      if (created < cutoff) continue;
      results.push({
        url: `${SB_URL}/storage/v1/object/public/promo-videos/${folder}/${file.name}`,
        filename: file.name,
        created_at: file.created_at || '',
      });
    }
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json(results.slice(0, 20));
}
