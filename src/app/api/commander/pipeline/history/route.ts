import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const pipelineBase = process.env.PIPELINE_BASE_URL;
  if (!pipelineBase) return NextResponse.json([]);

  const secret = process.env.PIPELINE_SECRET ?? '';

  try {
    const r = await fetch(`${pipelineBase}/api/post-log?days=14`, {
      headers: { 'x-pipeline-secret': secret, 'x-commander-slug': session.slug },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return NextResponse.json([]);
    const data = await r.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
