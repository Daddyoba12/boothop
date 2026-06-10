import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Default to today UK time
    const postDate = dateParam ?? new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/London',
    });

    const supabase = createSupabaseAdminClient();
    const { data: posts, error } = await supabase
      .from('bd_posts')
      .select('id, slot, slot_label, pillar, hook, script, caption, hashtags, visual_desc, music_track, video_url, post_date, created_at')
      .eq('post_date', postDate)
      .order('slot', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ posts: posts ?? [], date: postDate });
  } catch (error) {
    console.error('bd/posts error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
