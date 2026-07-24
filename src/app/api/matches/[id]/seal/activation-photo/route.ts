/**
 * POST /api/matches/[id]/seal/activation-photo
 *
 * Traveller uploads a photo of the applied SecureSeal before calling /seal/activate.
 * The returned storageKey is passed as activation_photo_url in the activate body.
 * Storage bucket: seal-photos (private).
 *
 * Mirrors the declaration-evidence upload pattern:
 *   - Image files only (no PDF/video — this is a physical evidence photo)
 *   - Max 20 MB
 *   - Storage key returned to caller; no DB row written here
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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

    const formData = await request.formData();
    const file     = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20 MB).' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, status')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }
    if (match.traveler_email !== session.email) {
      return NextResponse.json(
        { error: 'Only the carrier can upload the seal activation photo.' },
        { status: 403 }
      );
    }
    if (match.status !== 'seal_pending') {
      return NextResponse.json(
        { error: 'Seal activation photo can only be uploaded while the shipment is awaiting seal activation.' },
        { status: 409 }
      );
    }

    const ext   = file.name.split('.').pop() ?? 'jpg';
    const path  = `${matchId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('seal-photos')
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error('Seal photo upload error:', uploadErr);
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, storageKey: path });

  } catch (error) {
    console.error('seal/activation-photo error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
