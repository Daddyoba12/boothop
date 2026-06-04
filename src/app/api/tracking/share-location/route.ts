import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateBarcode } from '@/lib/utils/barcode';
import { getTierConfig } from '@/lib/services/tier-manager';
import { reverseGeocode } from '@/lib/services/geocoding';
import { sendCheckpointNotification } from '@/lib/services/notifications';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { travellerBarcode, latitude, longitude, checkpointType, photoUrl, notes } = await req.json();

    if (!travellerBarcode || !validateBarcode(travellerBarcode)) {
      return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
    }
    if (!travellerBarcode.startsWith('TRVL-')) {
      return NextResponse.json({ error: 'Use your traveller barcode (TRVL-...)' }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Valid latitude and longitude required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select('id, sender_email, traveler_email, delivery_tier, tracking_status, sender_barcode')
      .eq('traveller_barcode', travellerBarcode)
      .single();

    if (!match) return NextResponse.json({ error: 'Barcode not found' }, { status: 404 });
    if (match.tracking_status === 'completed') {
      return NextResponse.json({ error: 'Delivery already completed' }, { status: 400 });
    }

    const tierConfig = getTierConfig(match.delivery_tier || 'p2p');
    const cpType = checkpointType || 'location_check';

    const address = await reverseGeocode(lat, lng, tierConfig.precision, supabase);

    const { data: checkpoint } = await supabase
      .from('tracking_checkpoints')
      .insert({
        match_id:        match.id,
        checkpoint_type: cpType,
        latitude:        lat,
        longitude:       lng,
        address,
        initiated_by:    'traveller',
        photo_url:       photoUrl || null,
        notes:           notes || null,
      })
      .select('id, checkpoint_type, created_at')
      .single();

    // Mark all pending location_requests as completed
    await supabase
      .from('location_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('match_id', match.id)
      .eq('status', 'pending');

    // Update match tracking_status on milestones
    if (cpType === 'pickup') {
      await supabase.from('matches').update({ tracking_status: 'in_transit' }).eq('id', match.id);
    } else if (cpType === 'delivered') {
      await supabase.from('matches').update({ tracking_status: 'delivered' }).eq('id', match.id);
    }

    // Notify sender
    sendCheckpointNotification({
      recipientEmail:  match.sender_email,
      checkpointType:  cpType,
      location:        address,
      senderBarcode:   match.sender_barcode || travellerBarcode,
      tier:            match.delivery_tier || 'p2p',
      supabase,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      checkpoint: {
        id:        checkpoint?.id,
        type:      checkpoint?.checkpoint_type,
        location:  address,
        timestamp: checkpoint?.created_at,
      },
      tier: match.delivery_tier,
    });

  } catch (err: any) {
    console.error('share-location error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
