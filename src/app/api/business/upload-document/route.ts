import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE_MB = 10;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);
    if (!session?.email) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const formData = await request.formData();
    const file     = formData.get('file')    as File   | null;
    const jobRef   = formData.get('jobRef')  as string | null;
    const docType  = formData.get('docType') as string | null;

    if (!file)   return NextResponse.json({ error: 'No file provided.' },        { status: 400 });
    if (!jobRef) return NextResponse.json({ error: 'Job reference required.' },  { status: 400 });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Use PDF, JPG, PNG, or Word documents.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.` }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify job belongs to this user
    const { data: job } = await supabase
      .from('business_jobs')
      .select('id, email')
      .eq('job_ref', jobRef)
      .single();

    if (!job || job.email !== session.email) {
      return NextResponse.json({ error: 'Job not found or not authorised.' }, { status: 403 });
    }

    const ext      = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const safeName = (docType || 'document').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const path     = `${jobRef}/${safeName}-${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('booking-documents')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('upload-document storage error:', uploadError);
      // If bucket doesn't exist, give a clear message
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return NextResponse.json({ error: 'Document storage not yet configured. Please email documents to support@boothop.com.' }, { status: 503 });
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('booking-documents')
      .getPublicUrl(path);

    return NextResponse.json({ ok: true, path, url: publicUrl, name: file.name });
  } catch (error) {
    console.error('upload-document error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
