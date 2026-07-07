import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const base = process.env.PIPELINE_BASE_URL;
  if (!base) return NextResponse.json({ status: 'failed', error: 'Pipeline not configured' });

  const { jobId } = await params;
  const secret = process.env.PIPELINE_SECRET ?? '';
  const res  = await fetch(`${base}/commander/api/job/${jobId}`, { headers: { 'x-commander-slug': session.slug, 'x-pipeline-secret': secret } });
  const data = await res.json().catch(() => ({ status: 'failed' }));
  return NextResponse.json(data);
}
