import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ bakeId: string }> }) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const base = process.env.PIPELINE_BASE_URL;
  if (!base) return NextResponse.json({ error: 'Pipeline not configured' }, { status: 503 });

  const { bakeId } = await params;
  const res = await fetch(`${base}/api/download-bake/${bakeId}`, { headers: { 'x-commander-slug': session.slug } });
  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const blob = await res.blob();
  return new NextResponse(blob as any, {
    headers: {
      'content-type':        res.headers.get('content-type') || 'video/mp4',
      'content-disposition': `attachment; filename="bake_${bakeId}.mp4"`,
    },
  });
}
