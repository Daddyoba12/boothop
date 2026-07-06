import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const base = process.env.PIPELINE_BASE_URL;
  if (!base) return NextResponse.json({ error: 'Pipeline not configured. Set PIPELINE_BASE_URL.' }, { status: 503 });

  const body = await req.arrayBuffer();
  const ct   = req.headers.get('content-type') || '';

  const res = await fetch(`${base}/api/upload-video`, {
    method:  'POST',
    headers: { 'content-type': ct, 'x-commander-slug': session.slug },
    body,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
