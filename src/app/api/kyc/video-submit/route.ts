import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyAppSession, getSessionCookieName } from '@/lib/auth/session';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // ── Auth — read httpOnly session cookie ────────────────────────────────
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieName   = getSessionCookieName();
    const match0       = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${cookieName}=`));
    const token  = match0 ? decodeURIComponent(match0.split('=').slice(1).join('=')) : null;
    const session = token ? (() => { try { return verifyAppSession(token); } catch { return null; } })() : null;

    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const formData = await request.formData();
    const matchId  = formData.get('matchId') as string | null;
    const video    = formData.get('video')   as File | null;
    const photo    = formData.get('photo')   as File | null;

    if (!matchId || !video || !photo) {
      return NextResponse.json({ error: 'matchId, video and photo are all required.' }, { status: 400 });
    }

    const supabase  = createSupabaseAdminClient();
    const email     = session.email;
    const timestamp = Date.now();

    // ── Confirm the user belongs to this match ───────────────────────────────
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, booter_email, hooper_email, status')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    if (match.booter_email !== email && match.hooper_email !== email) {
      return NextResponse.json({ error: 'You are not part of this match.' }, { status: 403 });
    }

    // ── Upload video to Supabase Storage ─────────────────────────────────────
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    const videoPath   = `${matchId}/${email}/video-${timestamp}.webm`;

    const { error: videoUploadErr } = await supabase.storage
      .from('video-kyc')
      .upload(videoPath, videoBuffer, {
        contentType: 'video/webm',
        upsert: true,
      });

    if (videoUploadErr) {
      console.error('Video upload error:', videoUploadErr);
      return NextResponse.json({ error: 'Failed to upload video.' }, { status: 500 });
    }

    // ── Upload photo to Supabase Storage ─────────────────────────────────────
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoPath   = `${matchId}/${email}/photo-${timestamp}.jpg`;

    const { error: photoUploadErr } = await supabase.storage
      .from('video-kyc')
      .upload(photoPath, photoBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (photoUploadErr) {
      console.error('Photo upload error:', photoUploadErr);
      return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 });
    }

    // ── Determine which side of the match this user is ──────────────────────
    const isBooter   = match.booter_email === email;
    const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

    const updatePayload = isBooter
      ? {
          booter_video_kyc_path:       videoPath,
          booter_photo_kyc_path:       photoPath,
          booter_video_kyc_status:     'pending_review',
          booter_video_kyc_expires_at: expiresAt,
          booter_video_kyc_submitted:  timestamp,
        }
      : {
          hooper_video_kyc_path:       videoPath,
          hooper_photo_kyc_path:       photoPath,
          hooper_video_kyc_status:     'pending_review',
          hooper_video_kyc_expires_at: expiresAt,
          hooper_video_kyc_submitted:  timestamp,
        };

    const { error: updateErr } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', matchId);

    if (updateErr) {
      console.error('Match update error:', updateErr);
      // Non-blocking — files are uploaded, just couldn't write metadata
    }

    // ── Also upsert into a dedicated video_kyc table if it exists ────────────
    await supabase.from('video_kyc').upsert({
      match_id:       matchId,
      email,
      video_path:     videoPath,
      photo_path:     photoPath,
      status:         'pending_review',
      expires_at:     expiresAt,
      submitted_at:   new Date(timestamp).toISOString(),
    }, { onConflict: 'match_id,email' }).then(() => {}); // best-effort

    return NextResponse.json({
      ok: true,
      message: 'Video and photo submitted for review. You will be notified once verified.',
      expiresAt,
    });

  } catch (err) {
    console.error('video-submit error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 },
    );
  }
}
