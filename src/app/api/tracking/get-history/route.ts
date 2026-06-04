import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateBarcode } from '@/lib/utils/barcode';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get('barcode');
    if (!barcode || !validateBarcode(barcode)) {
      return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
    }

    const supabase  = getSupabase();
    const isSender  = barcode.startsWith('SEND-');
    const field     = isSender ? 'sender_barcode' : 'traveller_barcode';

    const { data: match } = await supabase
      .from('matches')
      .select(`
        id, status, tracking_status, delivery_tier, premium_tracking,
        sender_email, traveler_email, agreed_price,
        sender_barcode, traveller_barcode,
        payment_confirmed_at, created_at,
        sender_trip:sender_trip_id(from_city, to_city, travel_date)
      `)
      .eq(field, barcode)
      .single();

    if (!match) return NextResponse.json({ error: 'Barcode not found' }, { status: 404 });

    const { data: checkpoints } = await supabase
      .from('tracking_checkpoints')
      .select('id, checkpoint_type, latitude, longitude, address, photo_url, notes, created_at, initiated_by')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true });

    const trip: any = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;

    const CP_LABELS: Record<string, string> = {
      pickup:         'Item picked up',
      transit:        'In transit',
      delivered:      'Delivered',
      location_check: 'Location update',
    };

    const timeline = [
      { type: 'matched', label: 'Delivery matched', timestamp: match.created_at, icon: 'check' },
      { type: 'payment', label: 'Payment confirmed', timestamp: match.payment_confirmed_at, icon: 'payment' },
      ...(checkpoints || []).map(cp => ({
        type:        cp.checkpoint_type,
        label:       CP_LABELS[cp.checkpoint_type] || 'Update',
        location:    cp.address,
        lat:         cp.latitude,
        lng:         cp.longitude,
        photo:       cp.photo_url,
        notes:       cp.notes,
        timestamp:   cp.created_at,
        initiatedBy: cp.initiated_by,
        icon:        cp.checkpoint_type,
      })),
    ].filter(t => t.timestamp);

    const isDelivered = ['completed', 'delivered'].includes(match.tracking_status || '');
    if (!isDelivered && trip?.travel_date) {
      timeline.push({ type: 'expected', label: `Expected delivery: ${trip.travel_date}`, timestamp: trip.travel_date, icon: 'calendar' });
    }

    return NextResponse.json({
      success: true,
      match: {
        id:              match.id,
        status:          match.status,
        trackingStatus:  match.tracking_status,
        tier:            match.delivery_tier,
        premiumTracking: match.premium_tracking,
        fromCity:        trip?.from_city,
        toCity:          trip?.to_city,
        travelDate:      trip?.travel_date,
        senderBarcode:   match.sender_barcode,
        travellerBarcode: match.traveller_barcode,
        viewerRole:      isSender ? 'sender' : 'traveller',
        myBarcode:       barcode,
      },
      timeline,
      checkpoints: checkpoints || [],
    });

  } catch (err: any) {
    console.error('get-history error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
