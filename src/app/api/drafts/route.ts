import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSessionCookieName, verifyAppSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) return NextResponse.json({ drafts: [] });

    const session = verifyAppSession(token);
    const supabase = createSupabaseAdminClient();

    const { data: drafts } = await supabase
      .from('journey_drafts')
      .select('*')
      .eq('email', session.email)
      .eq('status', 'draft')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return NextResponse.json({ drafts: drafts || [] });
  } catch {
    return NextResponse.json({ drafts: [] });
  }
}
