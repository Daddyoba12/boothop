import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { moderateImage } from '@/lib/moderation';
import { checkRateLimit } from '@/lib/rate-limit';

// Phase 4 — enterprise audit trail: attachment upload.
// Files stored in Supabase Storage bucket 'match-attachments'.
// Allowed types: image/jpeg, image/png, image/webp, application/pdf.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file     = formData.get('file') as File | null;
    const matchId  = formData.get('matchId') as string | null;
    const label    = (formData.get('label') as string | null) ?? 'attachment';

    if (!file || !matchId) {
      return NextResponse.json({ error: 'file and matchId are required.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB).' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    // ── Rate limit: max 10 attachments per user per match per hour ───────────
    const rl = await checkRateLimit(`att:${email}:${matchId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({
        error: `Too many uploads. Please wait ${rl.retryAfter}s.`,
        code:  'RATE_LIMITED',
      }, { status: 429 });
    }

    // Verify participant
    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, locked_at')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    // Upload to Supabase Storage
    const ext   = file.name.split('.').pop() ?? 'bin';
    const path  = `${matchId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await file.arrayBuffer();

    // ── Image moderation via Claude vision ───────────────────────────────────
    if (file.type.startsWith('image/')) {
      const scan = await moderateImage(bytes, file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif');
      if (!scan.safe) {
        return NextResponse.json({
          error: scan.reason ?? 'This image cannot be uploaded.',
          code:  'CONTENT_BLOCKED',
        }, { status: 400 });
      }
    }

    const { error: uploadErr } = await supabase.storage
      .from('match-attachments')
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      throw new Error('Upload failed.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('match-attachments')
      .getPublicUrl(path);

    // Record in DB
    const { data: attachment } = await supabase
      .from('message_attachments')
      .insert({
        match_id:     matchId,
        uploader_email: email,
        label:        label.slice(0, 100),
        file_path:    path,
        public_url:   publicUrl,
        file_type:    file.type,
        file_size:    file.size,
      })
      .select('id, public_url, label, created_at')
      .single();

    return NextResponse.json({ ok: true, attachment });

  } catch (error) {
    console.error('attachments/upload error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
