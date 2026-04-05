import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'BootHop <noreply@boothop.com>';

// Vercel Cron: runs every 6 hours (see vercel.json)
// Guards against replay: only runs if invoked with the correct CRON_SECRET header

async function createActionToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  action_type: string,
  entity_id: string,
  payload: object,
  hoursValid = 48
) {
  const expires_at = new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type, entity_id, payload, expires_at })
    .select('token')
    .single();
  return data?.token as string;
}

export async function GET(request: Request) {
  // Vercel cron passes the secret in the Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

    // Find accepted matches where contact is unlocked but delivery is NOT yet complete
    const { data: matches } = await supabase
      .from('matches')
      .select(`*, sender_trip:sender_trip_id(*), traveler_trip:traveler_trip_id(*)`)
      .eq('status', 'accepted')
      .eq('payment_status', 'escrowed')
      .eq('contact_unlocked', true)
      .or('booter_confirmed_delivery.is.null,booter_confirmed_delivery.eq.false,hooper_confirmed_receipt.is.null,hooper_confirmed_receipt.eq.false');

    if (!matches || matches.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;

    for (const match of matches) {
      const route = `${match.sender_trip.from_city} → ${match.sender_trip.to_city}`;

      const { data: senderAuth }   = await supabase.auth.admin.getUserById(match.sender_user_id).catch(() => ({ data: null }));
      const { data: travelerAuth } = await supabase.auth.admin.getUserById(match.traveler_user_id).catch(() => ({ data: null }));

      const senderEmail   = senderAuth?.user?.email;
      const travelerEmail = travelerAuth?.user?.email;

      // Only send reminder to the party who hasn't confirmed yet
      const reminders: Promise<any>[] = [];

      if (!match.booter_confirmed_delivery && travelerEmail) {
        const token = await createActionToken(supabase, travelerEmail, 'confirm_collected', match.id, { role: 'traveler' });
        const confirmUrl = `${appUrl}/confirm?token=${token}`;
        reminders.push(
          resend.emails.send({
            from: FROM,
            to:   travelerEmail,
            subject: `BootHop Reminder: Confirm delivery for ${route}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:28px 40px;text-align:center;border-bottom:2px solid #1e40af;">
                  <div style="font-size:24px;font-weight:900;color:#fff;">✈️ Boot<span style="color:#38bdf8;">Hop</span></div>
                  <div style="color:#7dd3fc;font-size:11px;margin-top:4px;letter-spacing:1.5px;text-transform:uppercase;">Delivery Reminder</div>
                </div>
                <div style="padding:32px 40px;">
                  <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 16px;">Hi there — have you delivered the package?</h2>
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">Route: <strong style="color:#f1f5f9;">${route}</strong></p>
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Once you confirm delivery, the payment in escrow will be released to you.</p>
                  <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
                    ✅ Confirm I've Delivered
                  </a>
                  <p style="color:#475569;font-size:12px;margin-top:24px;">This link expires in 48 hours.</p>
                </div>
              </div>
            `,
            text: `BootHop reminder: Please confirm you've delivered the package for ${route}.\n\nConfirm: ${confirmUrl}`,
          })
        );
      }

      if (!match.hooper_confirmed_receipt && senderEmail) {
        const token = await createActionToken(supabase, senderEmail, 'confirm_delivered', match.id, { role: 'sender' });
        const confirmUrl = `${appUrl}/confirm?token=${token}`;
        reminders.push(
          resend.emails.send({
            from: FROM,
            to:   senderEmail,
            subject: `BootHop Reminder: Confirm you received your package for ${route}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:28px 40px;text-align:center;border-bottom:2px solid #1e40af;">
                  <div style="font-size:24px;font-weight:900;color:#fff;">✈️ Boot<span style="color:#38bdf8;">Hop</span></div>
                  <div style="color:#7dd3fc;font-size:11px;margin-top:4px;letter-spacing:1.5px;text-transform:uppercase;">Delivery Reminder</div>
                </div>
                <div style="padding:32px 40px;">
                  <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 16px;">Have you received your package?</h2>
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">Route: <strong style="color:#f1f5f9;">${route}</strong></p>
                  <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Please confirm receipt so the traveler can be paid. It only takes one click.</p>
                  <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
                    ✅ Confirm I've Received It
                  </a>
                  <p style="color:#475569;font-size:12px;margin-top:24px;">This link expires in 48 hours.</p>
                </div>
              </div>
            `,
            text: `BootHop reminder: Please confirm you received your package for ${route}.\n\nConfirm: ${confirmUrl}`,
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
