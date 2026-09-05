import { NextRequest, NextResponse } from 'next/server';
import { signCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get('admin') === '1';

  // Target slug for the demo
  const targetSlug = isAdmin ? 'boothop' : 'ginspired';

  // Look up the client in Supabase; fall back to boothop if not found
  const db = createSupabaseAdminClient();
  let slug = targetSlug;
  let company = isAdmin ? 'BootHop' : 'G-Inspired Automall LLC';
  let clientId = '0';

  try {
    const { data } = await db
      .from('pipeline_clients')
      .select('id, slug, company')
      .eq('slug', targetSlug)
      .single();
    if (data) {
      slug = data.slug;
      company = data.company;
      clientId = String(data.id);
    } else if (!isAdmin) {
      // fallback: use boothop as client demo if g_inspired not found
      const { data: bh } = await db
        .from('pipeline_clients')
        .select('id, slug, company')
        .eq('slug', 'boothop')
        .single();
      if (bh) {
        slug = bh.slug;
        company = bh.company;
        clientId = String(bh.id);
      }
    }
  } catch { /* use defaults */ }

  const token = signCommanderSession({
    clientId,
    slug,
    company,
    email: '',
    isSuper: isAdmin,
    isTempPassword: false,
  });

  const cookieName = 'boothop_commander_session';
  const dest = new URL(`/commander/pipeline/${slug}?tour=${isAdmin ? 'admin' : 'client'}`, req.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2, // 2-hour demo
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
