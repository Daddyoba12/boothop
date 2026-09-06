import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const WA_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_API      = `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`;

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  if (!WA_TOKEN || !WA_PHONE_ID)
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 503 });

  const { video_url, caption, forClient } = await req.json().catch(() => ({} as any));
  if (!video_url) return NextResponse.json({ error: 'video_url required' }, { status: 400 });

  const slug = (session.isSuper && forClient) ? forClient : session.slug;
  const db = createSupabaseAdminClient();

  // Get client's whatsapp number from their saved profile
  const { data: clientRow } = await db
    .from('pipeline_clients')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!clientRow?.id)
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { data: profile } = await db
    .from('company_profiles')
    .select('whatsapp')
    .eq('company_id', clientRow.id)
    .single();

  const toNumber = profile?.whatsapp?.replace(/\D/g, '');
  if (!toNumber)
    return NextResponse.json({ error: 'No WhatsApp number in profile. Add it in the Onboard tab.' }, { status: 400 });

  try {
    const res = await fetch(WA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNumber,
        type: 'video',
        video: {
          link: video_url,
          caption: caption || 'New video from BootHop Pipeline',
        },
      }),
    });
    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id)
      return NextResponse.json({ ok: true });
    return NextResponse.json({ error: data.error?.message || 'WhatsApp send failed' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
