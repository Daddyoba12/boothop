import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { sendMatchCancelledEmail } from '@/lib/email/sendMatchEmail';

// Free cancel — no payment made yet
const FREE_CANCEL   = ['matched', 'agreed', 'committed', 'kyc_pending', 'kyc_complete'];
// Payment pending/processing — refund request (90% rule)
const REFUND_CANCEL = ['payment_processing'];
// Post-contact-release — no cancel, must dispute
const NO_CANCEL     = ['active', 'delivery_confirmed', 'disputed', 'completed'];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, reason } = await request.json();
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (NO_CANCEL.includes(match.status)) {
      return NextResponse.json({
        error: 'This match cannot be cancelled after contact details have been released. Please raise a dispute if there is an issue.',
        canDispute: true,
      }, { status: 400 });
    }

    if (FREE_CANCEL.includes(match.status)) {
      await supabase
        .from('matches')
        .update({ status: 'cancelled', cancelled_by: email, cancelled_at: new Date().toISOString(), cancellation_reason: reason ?? null })
        .eq('id', matchId);

      const trip      = (match as any).sender_trip;
      const fromCity  = trip?.from_city   ?? '';
      const toCity    = trip?.to_city     ?? '';
      const travelDate = trip?.travel_date ?? '';
      const otherEmail = match.sender_email === email ? match.traveler_email : match.sender_email;

      await Promise.allSettled([
        sendMatchCancelledEmail({ toEmail: email,       fromCity, toCity, travelDate, cancelledByYou: true,  reason: reason ?? undefined }),
        sendMatchCancelledEmail({ toEmail: otherEmail,  fromCity, toCity, travelDate, cancelledByYou: false, reason: reason ?? undefined }),
      ]);

      return NextResponse.json({ ok: true, type: 'free_cancel' });
    }

    if (REFUND_CANCEL.includes(match.status)) {
      // Payment was submitted — flag for admin to process refund (90%)
      await supabase
        .from('matches')
        .update({ status: 'cancellation_requested', cancelled_by: email, cancelled_at: new Date().toISOString(), cancellation_reason: reason ?? null })
        .eq('id', matchId);

      const trip         = (match as any).sender_trip;
      const fromCity     = trip?.from_city ?? '';
      const toCity       = trip?.to_city   ?? '';
      const agreedPrice  = match.agreed_price ?? 0;
      const refundAmount = (agreedPrice * 0.90).toFixed(2);
      const adminEmail   = process.env.ADMIN_EMAIL   || 'admin@boothop.com';
      const from         = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
      const appUrl       = process.env.NEXT_PUBLIC_APP_URL || '';
      const resend       = new Resend(process.env.RESEND_API_KEY);

      await Promise.allSettled([
        // Alert admin
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `[REFUND REQUEST] ${fromCity} → ${toCity} — £${refundAmount}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
              <h2>Cancellation + refund request</h2>
              <p><strong>Route:</strong> ${fromCity} → ${toCity}</p>
              <p><strong>Requested by:</strong> ${email}</p>
              <p><strong>Original amount:</strong> £${agreedPrice.toFixed(2)}</p>
              <p><strong>Refund due (90%):</strong> £${refundAmount}</p>
              <p><strong>Reason:</strong> ${reason ?? 'Not provided'}</p>
              <p>Match ID: ${matchId}</p>
              <p>Please process the refund and update the match status in the admin hub: <a href="${appUrl}/admin/hub?adminKey=${process.env.ADMIN_SECRET}">${appUrl}/admin/hub</a></p>
            </div>
          `,
          text: `Refund request: ${fromCity} → ${toCity}\nBy: ${email}\nAmount: £${refundAmount}\nReason: ${reason}`,
        }),
        // Confirm to canceller
        resend.emails.send({
          from,
          to: email,
          subject: `Cancellation request received — ${fromCity} → ${toCity}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              <h2 style="margin:24px 0 8px;">Cancellation request received</h2>
              <p style="color:#475569;">Your cancellation request for <strong>${fromCity} → ${toCity}</strong> has been received.</p>
              <p style="color:#475569;">As payment was already being processed, a refund of <strong>£${refundAmount}</strong> (90% of £${agreedPrice.toFixed(2)}) will be issued within 3–5 business days.</p>
              <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Reply to this email if you need help.</p>
            </div>
          `,
          text: `Cancellation received. Refund of £${refundAmount} will be processed within 3-5 business days.`,
        }),
        // Notify other party
        resend.emails.send({
          from,
          to: match.sender_email === email ? match.traveler_email : match.sender_email,
          subject: `Match cancelled — ${fromCity} → ${toCity}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              <h2 style="margin:24px 0 8px;">❌ Match cancelled</h2>
              <p style="color:#475569;">The other party has cancelled the <strong>${fromCity} → ${toCity}</strong> delivery. The match has been closed and you will not be charged.</p>
              <p style="color:#475569;">Your trip remains active on BootHop and we will continue to look for a new match.</p>
              <a href="${appUrl}/dashboard" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">View Dashboard →</a>
              <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Reply to this email if you need help.</p>
            </div>
          `,
          text: `The other party cancelled the ${fromCity} → ${toCity} match. You will not be charged. Your trip remains active on BootHop.`,
        }),
      ]);

      return NextResponse.json({ ok: true, type: 'refund_requested', refundAmount: parseFloat(refundAmount) });
    }

    return NextResponse.json({ error: 'This match cannot be cancelled.' }, { status: 400 });

  } catch (error) {
    console.error('matches/cancel error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
