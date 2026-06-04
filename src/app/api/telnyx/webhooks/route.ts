import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TELNYX WEBHOOK HANDLER
// Receives delivery receipts and call status events from Telnyx
// Register in Telnyx Portal → Messaging → Profiles → Webhook URL:
//   https://www.boothop.com/api/telnyx/webhooks
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.data;

    if (!event) {
      return NextResponse.json({ received: true });
    }

    const eventType = event.event_type || event.record_type;
    console.log(`📱 Telnyx webhook: ${eventType}`);

    switch (eventType) {
      case 'message.finalized': {
        const msg = event.payload;
        const status = msg?.to?.[0]?.status;
        const msgId  = msg?.id;
        console.log(`SMS ${msgId}: ${status}`);

        if (status === 'delivery_failed') {
          console.warn(`⚠️  SMS delivery failed: ${msgId} — error: ${msg?.errors?.[0]?.detail}`);
          // Log to DB for visibility
          getSupabase().from('tracking_history').insert({
            match_id:    null,
            action_type: 'sms_delivery_failed',
            metadata:    { messageId: msgId, error: msg?.errors?.[0]?.detail, to: msg?.to?.[0]?.phone_number },
          }).then(() => {});
        }
        break;
      }

      case 'call.hangup': {
        const callId = event.payload?.call_control_id;
        console.log(`📞 Call ended: ${callId} — ${event.payload?.hangup_cause}`);
        break;
      }

      default:
        // Acknowledge without processing unknown events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Telnyx webhook error:', err.message);
    return NextResponse.json({ received: true }); // Always 200 to Telnyx
  }
}
