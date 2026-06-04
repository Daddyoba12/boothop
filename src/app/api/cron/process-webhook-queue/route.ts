import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { popFailedEvents, setWebhookEventStatus } from '@/lib/redis';
import { Resend } from 'resend';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2026-02-25.clover' as any });
}

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

function isAuthorized(req: Request): boolean {
  const auth     = req.headers.get('authorization');
  const adminKey = req.headers.get('x-admin-key');
  return (
    auth     === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_SECRET
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runQueueProcessor();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runQueueProcessor();
}

async function runQueueProcessor() {
  const failedIds = await popFailedEvents(20);

  if (!failedIds.length) {
    return NextResponse.json({ ok: true, retried: 0, message: 'No failed events in queue.' });
  }

  const stripe     = getStripe();
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
  const webhookUrl = `${appUrl}/api/webhooks/stripe`;
  const cronSecret = process.env.CRON_SECRET!;

  const retried: string[]  = [];
  const stillFailed: string[] = [];

  for (const eventId of failedIds) {
    try {
      // Fetch the full event from Stripe
      const event = await stripe.events.retrieve(eventId);

      // Re-POST to the webhook handler with internal bypass header
      // The webhook handler checks this header and skips signature verification
      const res = await fetch(webhookUrl, {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-internal-bypass':  cronSecret,
        },
        body: JSON.stringify(event),
      });

      if (res.ok) {
        await setWebhookEventStatus(eventId, 'processed');
        retried.push(eventId);
      } else {
        stillFailed.push(eventId);
      }
    } catch (err) {
      console.error(`Failed to retry event ${eventId}:`, err);
      stillFailed.push(eventId);
    }
  }

  // Notify admin if events still failing
  if (stillFailed.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    getResend().emails.send({
      from:    'BootHop System <noreply@boothop.com>',
      to:      [adminEmail],
      subject: `⚠️ Stripe webhook retry: ${stillFailed.length} event(s) still failing`,
      text: `The following Stripe event IDs failed to process after retry:\n\n${stillFailed.join('\n')}\n\nCheck Stripe dashboard and server logs.`,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:          true,
    total:       failedIds.length,
    retried:     retried.length,
    stillFailed: stillFailed.length,
    retriedIds:  retried,
    failedIds:   stillFailed,
  });
}
