import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function resolveSlugAndId(session: NonNullable<Awaited<ReturnType<typeof getCommanderSession>>>, req: NextRequest) {
  const forClient = new URL(req.url).searchParams.get('forClient')?.trim().toLowerCase() || '';
  if (session.isSuper && forClient && forClient !== session.slug) {
    const db = createSupabaseAdminClient();
    const { data } = await db
      .from('pipeline_clients')
      .select('id, slug')
      .eq('slug', forClient)
      .single();
    if (data) return { clientId: data.id as string, slug: data.slug as string };
  }
  return { clientId: session.clientId, slug: session.slug };
}

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { clientId, slug } = await resolveSlugAndId(session, req);
  const db = createSupabaseAdminClient();

  // Read the current company profile (niche/bio is the key input to the pipeline)
  const { data: profile } = await db
    .from('company_profiles')
    .select('business_name, bio, platforms_json, custom_1_label, custom_1_value, custom_2_label, custom_2_value, custom_3_label, custom_3_value, custom_4_label, custom_4_value')
    .eq('company_id', clientId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'No profile found — fill in the Onboard tab first.' }, { status: 400 });
  }

  // Build a niche summary the pipeline can use
  const customs: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const lbl = (profile as any)[`custom_${i}_label`];
    const val = (profile as any)[`custom_${i}_value`];
    if (lbl && val) customs.push(`${lbl}: ${val}`);
  }

  const nicheSummary = [
    profile.bio ? `Brand/Niche: ${profile.bio}` : '',
    ...customs,
  ].filter(Boolean).join('\n');

  // Stamp a sync timestamp on the profile so the Oracle pipeline knows to re-read it
  await db
    .from('company_profiles')
    .update({ updated_at: new Date().toISOString() })
    .eq('company_id', clientId);

  // Also write niche summary to otb_pipeline_state so the Oracle can pick it up
  // Uses upsert — safe if the row doesn't exist yet, or if niche_override column doesn't exist
  // (the pipeline reads company_profiles.bio directly on each generation run)
  try {
    await db
      .from('otb_pipeline_state')
      .upsert({
        company_slug:       slug,
        slot:               0,
        niche_override:     nicheSummary,
        niche_synced_at:    new Date().toISOString(),
      }, { onConflict: 'company_slug,slot', ignoreDuplicates: false });
  } catch {
    // Column may not exist on older deployments — silently skip, profile sync is the primary signal
  }

  const platforms: string[] = (() => { try { return JSON.parse(profile.platforms_json || '[]'); } catch { return []; } })();

  return NextResponse.json({
    ok: true,
    synced: {
      business: profile.business_name,
      platforms,
      niche_lines: nicheSummary.split('\n').filter(Boolean).length,
    },
  });
}
