import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateBarcode } from '@/lib/utils/barcode';
import { getTierConfig } from '@/lib/services/tier-manager';
import { sendPushToEmail, logCost } from '@/lib/services/notifications';
import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { senderBarcode } = await req.json();

    if (!senderBarcode || !validateBarcode(senderBarcode)) {
      return NextResponse.json({ error: 'Invalid barcode format' }, { status: 400 });
    }
    if (!senderBarcode.startsWith('SEND-')) {
      return NextResponse.json({ error: 'Please scan your sender barcode (SEND-...)' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select('id, status, delivery_tier, tracking_status, sender_email, traveler_email, traveller_barcode')
      .eq('sender_barcode', senderBarcode)
      .single();

    if (!match) return NextResponse.json({ error: 'Barcode not found' }, { status: 404 });
    if (match.tracking_status === 'completed') {
      return NextResponse.json({ status: 'completed', message: 'Delivery already completed' });
    }

    // Only allow location requests when the delivery is actually underway
    if (!['active', 'delivery_confirmed'].includes(match.status)) {
      return NextResponse.json({
        error: 'Location tracking is only available once your delivery is active.',
        status: 'not_active',
      }, { status: 400 });
    }

    if (!match.traveller_barcode) {
      return NextResponse.json({ error: 'Traveller barcode not yet assigned for this delivery.' }, { status: 400 });
    }

    const tier = getTierConfig(match.delivery_tier || 'p2p');
    const windowMs = 5 * 60 * 1000;
    const windowStart = new Date(Date.now() - windowMs).toISOString();

    const { count } = await supabase
      .from('location_requests')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', match.id)
      .gte('created_at', windowStart);

    if ((count || 0) >= tier.locationRequestsPerWindow) {
      return NextResponse.json({
        status: 'rate_limited',
        message: `You can request ${tier.locationRequestsPerWindow} location updates every 5 minutes`,
        retryAfter: 300,
      });
    }

    // Latest known location (returned as fallback)
    const { data: lastCp } = await supabase
      .from('tracking_checkpoints')
      .select('address, checkpoint_type, created_at, latitude, longitude, photo_url')
      .eq('match_id', match.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const expiresAt = new Date(Date.now() + tier.pollTimeoutMs).toISOString();

    const { data: locReq } = await supabase
      .from('location_requests')
      .insert({ match_id: match.id, requested_by: match.sender_email, status: 'pending', expires_at: expiresAt })
      .select('id')
      .single();

    // Notify traveller — push first, then email
    await sendPushToEmail(supabase, match.traveler_email, {
      title: 'Location requested',
      body: 'The sender wants a location update. Open BootHop to share.',
      url: `${APP_URL}/track/${match.traveller_barcode}`,
    }).catch(() => {});

    const resend = new Resend(process.env.RESEND_API_KEY!);
    resend.emails.send({
      from: 'BootHop Tracking <noreply@boothop.com>',
      to: match.traveler_email,
      subject: 'Location request from your sender',
      html: `<div style="font-family:system-ui;padding:32px;background:#07111f;color:#e2e8f0;">
        <h2 style="color:#10b981;">Location requested</h2>
        <p style="color:#94a3b8;">The sender of your delivery wants a location update. This request expires in ${tier.pollTimeoutMs / 1000} seconds.</p>
        <a href="${APP_URL}/track/${match.traveller_barcode}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Share My Location</a>
      </div>`,
    }).catch(() => {});

    // Long-poll for response
    const pollStart = Date.now();
    while (Date.now() - pollStart < tier.pollTimeoutMs) {
      await new Promise(r => setTimeout(r, 2000));

      const { data: req } = await supabase
        .from('location_requests')
        .select('status')
        .eq('id', locReq!.id)
        .single();

      if (req?.status === 'completed') {
        const { data: cp } = await supabase
          .from('tracking_checkpoints')
          .select('latitude, longitude, address, checkpoint_type, created_at, photo_url')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        await logCost(supabase, match.id, match.delivery_tier || 'p2p', 'location_request', 0.001);

        return NextResponse.json({
          status: 'delivered',
          location: {
            address:   cp?.address,
            lat:       cp?.latitude,
            lng:       cp?.longitude,
            type:      cp?.checkpoint_type,
            timestamp: cp?.created_at,
            photo:     cp?.photo_url || null,
          },
        });
      }

      if (req?.status === 'declined') {
        return NextResponse.json({
          status: 'declined',
          message: 'Traveller is unable to share location right now',
          lastKnown: lastCp ? { address: lastCp.address, type: lastCp.checkpoint_type, timestamp: lastCp.created_at } : null,
        });
      }
    }

    await supabase.from('location_requests').update({ status: 'timeout' }).eq('id', locReq!.id);

    return NextResponse.json({
      status: 'timeout',
      message: 'No response from traveller',
      lastKnown: lastCp ? { address: lastCp.address, type: lastCp.checkpoint_type, timestamp: lastCp.created_at } : null,
    });

  } catch (err: any) {
    console.error('scan-sender-barcode error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
