import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBarcode } from '@/lib/utils/barcode';
import { determineTier } from '@/lib/services/tier-manager';
import { sendBarcodeNotification } from '@/lib/services/notifications';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { matchId } = await req.json();
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

    const supabase = getSupabase();

    const { data: match } = await supabase
      .from('matches')
      .select(`
        id, status, sender_email, traveler_email, agreed_price,
        sender_barcode, traveller_barcode, delivery_tier, premium_tracking,
        sender_trip:sender_trip_id(from_city, to_city, travel_date)
      `)
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Idempotent — return existing if already generated
    if (match.sender_barcode && match.traveller_barcode) {
      return NextResponse.json({
        success: true,
        senderBarcode: match.sender_barcode,
        travellerBarcode: match.traveller_barcode,
        tier: match.delivery_tier,
        alreadyGenerated: true,
      });
    }

    const tier = determineTier({
      premium_tracking: match.premium_tracking,
      agreed_price: match.agreed_price,
    });

    // Collision-checked barcode generation
    let senderBarcode = '';
    let travellerBarcode = '';

    for (let i = 0; i < 10; i++) {
      const c = generateBarcode('SEND', matchId);
      const { data: ex } = await supabase.from('matches').select('id').eq('sender_barcode', c).maybeSingle();
      if (!ex) { senderBarcode = c; break; }
    }
    for (let i = 0; i < 10; i++) {
      const c = generateBarcode('TRVL', matchId);
      const { data: ex } = await supabase.from('matches').select('id').eq('traveller_barcode', c).maybeSingle();
      if (!ex) { travellerBarcode = c; break; }
    }

    if (!senderBarcode || !travellerBarcode) {
      return NextResponse.json({ error: 'Failed to generate unique barcodes' }, { status: 500 });
    }

    await supabase.from('matches').update({
      sender_barcode: senderBarcode,
      traveller_barcode: travellerBarcode,
      delivery_tier: tier,
      tracking_status: 'active',
    }).eq('id', matchId);

    supabase.from('tracking_history').insert({
      match_id: matchId,
      action_type: 'barcodes_generated',
      metadata: { senderBarcode, travellerBarcode, tier },
    }).then(() => {});

    const trip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;

    sendBarcodeNotification({
      senderEmail: match.sender_email,
      travellerEmail: match.traveler_email,
      senderBarcode,
      travellerBarcode,
      fromCity: (trip as any)?.from_city || '',
      toCity: (trip as any)?.to_city || '',
      tier,
      matchId,
      premiumTracking: !!match.premium_tracking,
      supabase,
    }).catch(err => console.error('Barcode notification error:', err));

    return NextResponse.json({ success: true, senderBarcode, travellerBarcode, tier });
  } catch (err: any) {
    console.error('generate-barcodes error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
