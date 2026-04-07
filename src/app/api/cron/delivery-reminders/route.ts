import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendCarrierDeliveryReminderEmail, sendSenderReceiptReminderEmail } from '@/lib/email/sendDeliveryEmail';

async function createActionToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  action_type: string,
  entity_id: string,
  payload: object,
  hoursValid = 48
) {
  const expires_at = new Date(Date.now() + hoursValid * 3_600_000).toISOString();
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type, entity_id, payload, expires_at })
    .select('token')
    .single();
  return data?.token as string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Active matches where at least one party hasn't confirmed yet
    const { data: matches } = await supabase
      .from('matches')
      .select('id, sender_email, traveler_email, agreed_price, booter_confirmed_delivery, hooper_confirmed_receipt, sender_trip:sender_trip_id(from_city, to_city)')
      .eq('status', 'active')
      .or('booter_confirmed_delivery.is.null,booter_confirmed_delivery.eq.false,hooper_confirmed_receipt.is.null,hooper_confirmed_receipt.eq.false');

    if (!matches?.length) {
      return NextResponse.json({ sent: 0, matchesChecked: 0 });
    }

    let sent = 0;

    for (const match of matches) {
      const trip      = (match as any).sender_trip;
      const fromCity  = trip?.from_city ?? '';
      const toCity    = trip?.to_city   ?? '';
      const reminders: Promise<any>[] = [];

      // Carrier hasn't confirmed delivery
      if (!match.booter_confirmed_delivery && match.traveler_email) {
        const token = await createActionToken(supabase, match.traveler_email, 'confirm_collected', match.id, { role: 'traveler' });
        reminders.push(
          sendCarrierDeliveryReminderEmail({
            toEmail:      match.traveler_email,
            fromCity,
            toCity,
            matchId:      match.id,
            confirmToken: token,
          })
        );
      }

      // Sender hasn't confirmed receipt
      if (!match.hooper_confirmed_receipt && match.sender_email) {
        const token = await createActionToken(supabase, match.sender_email, 'confirm_delivered', match.id, { role: 'sender' });
        reminders.push(
          sendSenderReceiptReminderEmail({
            toEmail:      match.sender_email,
            fromCity,
            toCity,
            matchId:      match.id,
            confirmToken: token,
          })
        );
      }

      if (reminders.length > 0) {
        await Promise.allSettled(reminders);
        sent += reminders.length;
      }
    }

    return NextResponse.json({ sent, matchesChecked: matches.length });

  } catch (error) {
    console.error('Delivery reminder cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
