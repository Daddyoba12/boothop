import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { requireAdminApi } from '@/lib/auth/admin';
import { ADMIN_DOWNLOADS } from '@/lib/admin-downloads';

const DOWNLOADS_DIR = path.join(process.cwd(), 'private', 'downloads');

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename } = await params;
  // Only ever serve a file listed in ADMIN_DOWNLOADS — blocks path traversal
  // and anything not explicitly approved for admin download.
  const entry = ADMIN_DOWNLOADS.find(d => d.file === filename);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const filePath = path.join(DOWNLOADS_DIR, entry.file);
  try {
    await stat(filePath);
    const buf = await readFile(filePath);
    const ext = entry.file.split('.').pop()?.toLowerCase() ?? '';
    const disposition = req.nextUrl.searchParams.get('view') === '1' ? 'inline' : 'attachment';
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Content-Disposition': `${disposition}; filename="${entry.file}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
