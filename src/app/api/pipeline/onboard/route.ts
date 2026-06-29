import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ORACLE_HOST = 'http://140.238.73.32';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { company, slug, email, contact_name, plan, platforms, location } = body as Record<string, unknown>;

  // Save to Supabase so the admin panel has the data
  try {
    const db = createSupabaseAdminClient();
    await db.from('pipeline_clients').upsert({
      slug:         slug ?? '',
      company:      company ?? '',
      email:        email ?? null,
      contact_name: contact_name ?? null,
      plan:         plan ?? 'basic',
      platforms:    platforms ?? null,
      location:     location ?? null,
      status:       'pending',
    }, { onConflict: 'slug' });
  } catch {
    // Non-blocking — don't fail the request if Supabase save fails
  }

  // Forward the full payload to Oracle
  try {
    const oracleRes = await fetch(`${ORACLE_HOST}/api/onboard`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await oracleRes.json();
    return NextResponse.json(data, { status: oracleRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'Pipeline server unavailable', detail: String(err) }, { status: 502 });
  }
}
