import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendDisputeResolvedEmail } from '@/lib/email/sendDisputeEmail';

// resolution options: refund_sender | pay_carrier | split | no_action
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { disputeId, resolution, note } = await request.json();
    if (!disputeId || !resolution) {
      return NextResponse.json({ error: 'disputeId and resolution are required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: dispute } = await supabase
      .from('disputes')
      .select('id, match_id, raised_by, status')
      .eq('id', disputeId)
      .maybeSingle();

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }

    if (dispute.status !== 'open') {
      return NextResponse.json({ error: 'Dispute is already resolved.' }, { status: 400 });
    }

    // Update dispute
    await supabase
      .from('disputes')
      .update({ status: 'resolved', resolution, admin_note: note ?? null, resolved_at: new Date().toISOString() })
      .eq('id', disputeId);

    // Update match status based on resolution
    const matchStatus = resolution === 'no_action' ? 'active' : 'completed';
    await supabase
      .from('matches')
      .update({ status: matchStatus })
      .eq('id', dispute.match_id);

    // Fetch both parties to email them
    const { data: match } = await supabase
      .from('matches')
      .select('sender_email, traveler_email, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('id', dispute.match_id)
      .single();

    if (match) {
      const trip         = (match as any).sender_trip;
      const fromCity     = trip?.from_city ?? '';
      const toCity       = trip?.to_city   ?? '';
      const resolutionLabel: Record<string, string> = {
        refund_sender: 'Refund issued to sender',
        pay_carrier:   'Payment released to carrier',
        split:         'Payment split between both parties',
        no_action:     'No action taken — match remains active',
      };
      const label = resolutionLabel[resolution] ?? resolution;

      await Promise.allSettled([
        match.sender_email   && sendDisputeResolvedEmail({ toEmail: match.sender_email,   fromCity, toCity, resolution: label, note: note ?? '' }),
        match.traveler_email && sendDisputeResolvedEmail({ toEmail: match.traveler_email, fromCity, toCity, resolution: label, note: note ?? '' }),
      ]);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('admin/disputes/resolve error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
