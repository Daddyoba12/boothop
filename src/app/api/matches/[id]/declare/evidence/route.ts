/**
 * POST /api/matches/[id]/declare/evidence
 * Upload a file as declaration evidence (photo/video/proof_of_ownership).
 * Requires an existing draft declaration_id on the match.
 * Reuses the same Supabase Storage upload pattern as messages/attachments.
 * Storage bucket: declaration-evidence (create in Supabase dashboard, private).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'];
const MAX_BYTES     = 20 * 1024 * 1024; // 20 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);

    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const formData    = await request.formData();
    const file        = formData.get('file') as File | null;
    const evidenceType = (formData.get('evidence_type') as string | null) ?? 'photo';

    if (!file) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, PDF, MP4, and MOV files are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20 MB).' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify match + sender + get declaration_id
    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, declaration_id, status')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    if (match.sender_email !== session.email) {
      return NextResponse.json({ error: 'Only the sender can upload declaration evidence.' }, { status: 403 });
    }
    if (!match.declaration_id) {
      return NextResponse.json({ error: 'Save a draft first before uploading evidence.' }, { status: 409 });
    }
    if (match.status !== 'locked_pending_compliance') {
      return NextResponse.json({ error: 'Evidence can only be uploaded while the declaration is in draft.' }, { status: 409 });
    }

    // Verify declaration is still draft
    const { data: decl } = await supabase
      .from('item_declarations')
      .select('declaration_status')
      .eq('id', match.declaration_id)
      .maybeSingle();

    if (decl?.declaration_status !== 'draft') {
      return NextResponse.json({ error: 'Declaration has been submitted — no further uploads allowed.' }, { status: 409 });
    }

    // Upload to Supabase Storage
    const ext      = file.name.split('.').pop() ?? 'bin';
    const path     = `${matchId}/${match.declaration_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes    = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('declaration-evidence')
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error('Evidence upload error:', uploadErr);
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }

    // Private bucket — store the storage key, generate a signed URL for immediate response
    const { data: signedData, error: signErr } = await supabase.storage
      .from('declaration-evidence')
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (signErr || !signedData) {
      console.error('Signed URL error:', signErr);
      return NextResponse.json({ error: 'Upload succeeded but could not generate preview URL.' }, { status: 500 });
    }

    const { data: evidence } = await supabase
      .from('declaration_evidence')
      .insert({
        declaration_id: match.declaration_id,
        match_id:       matchId,
        evidence_type:  evidenceType,
        file_url:       path,   // store the storage key, not a URL
        storage_key:    path,
        mime_type:      file.type,
        uploaded_by:    session.email,
      })
      .select('id, evidence_type, mime_type, created_at')
      .single();

    // Return signed URL in response so the UI can show a preview immediately
    return NextResponse.json({ ok: true, evidence: { ...evidence, file_url: signedData.signedUrl } });

  } catch (error) {
    console.error('declare/evidence error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
