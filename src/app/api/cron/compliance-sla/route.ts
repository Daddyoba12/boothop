/**
 * /api/cron/compliance-sla — runs hourly via cron-job.org
 *
 * Checks three SLA windows:
 *  1. locked_pending_compliance: 48h to submit declaration
 *     - 24h reminder at 24h remaining (locked 24h ago)
 *     - 6h  reminder at 6h  remaining (locked 42h ago)
 *     - Auto-cancel + refund at expiry (locked 48h+ ago)
 *  2. compliance_in_progress: 24h for review — escalate to admin if overdue
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  sendDeclarationPromptEmail,
  sendComplianceTimeoutEmail,
} from '@/lib/email/sendComplianceEmail';
import { sendResendEmail } from '@/lib/resend-client';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
const from       = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now      = Date.now();

    // Time anchors for the 48h declaration SLA
    const cutoff48h = new Date(now - 48 * 3_600_000).toISOString();  // timed out
    const cutoff42h = new Date(now - 42 * 3_600_000).toISOString();  // 6h remaining
    const cutoff24h = new Date(now - 24 * 3_600_000).toISOString();  // 24h remaining

    // Time anchor for 24h review SLA
    const cutoffReview24h = new Date(now - 24 * 3_600_000).toISOString();

    const results = {
      timed_out:        0,
      reminders_24h:    0,
      reminders_6h:     0,
      review_escalated: 0,
    };

    // ── 1a. Timed out — locked 48h+ ago, no submitted declaration ────────────
    const { data: timedOut } = await supabase
      .from('matches')
      .select(`
        id, sender_email, traveler_email, compliance_locked_at,
        sender_trip:sender_trip_id(from_city, to_city)
      `)
      .eq('status', 'locked_pending_compliance')
      .lt('compliance_locked_at', cutoff48h);

    for (const match of timedOut ?? []) {
      // Check no submitted declaration exists (sender might have submitted very late)
      const { data: decl } = await supabase
        .from('item_declarations')
        .select('id, declaration_status')
        .eq('match_id', match.id)
        .maybeSingle();

      if (decl?.declaration_status === 'submitted') continue;

      const nowIso = new Date().toISOString();
      const trip     = Array.isArray(match.sender_trip) ? match.sender_trip[0] : (match.sender_trip as any);
      const fromCity = trip?.from_city ?? '';
      const toCity   = trip?.to_city   ?? '';

      await supabase.from('matches').update({ status: 'compliance_timeout' }).eq('id', match.id);

      await supabase.from('shipment_events').insert([
        {
          match_id:     match.id,
          event_type:   'COMPLIANCE_TIMEOUT',
          performed_by: 'system',
          metadata:     { locked_at: match.compliance_locked_at },
        },
        {
          match_id:     match.id,
          event_type:   'SHIPMENT_CANCELLED_TIMEOUT',
          performed_by: 'system',
        },
      ]);

      await Promise.allSettled([
        match.sender_email && sendComplianceTimeoutEmail({
          toEmail: match.sender_email, fromCity, toCity, matchId: match.id,
        }),
        match.traveler_email && sendResendEmail({
          from,
          to:      match.traveler_email,
          subject: `Booking cancelled — sender missed deadline | ${fromCity} → ${toCity}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
            <div style="margin-bottom:24px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏰ Booking cancelled</h2>
            <p style="font-size:15px;color:#475569;margin:0 0 20px;">The sender did not complete their item declaration for <strong>${fromCity} → ${toCity}</strong> within the required timeframe. The booking has been cancelled. No action is needed from you — your account is in good standing and we will look for a new match for your route.</p>
          </div>`,
          text: `Your ${fromCity} → ${toCity} booking has been cancelled — the sender missed their declaration deadline. No action needed. We will find you another match.`,
        }),
      ]);

      results.timed_out++;
    }

    // ── 1b. 6h reminder — locked 42h+ ago, not timed out, no 6h reminder sent ─
    const { data: due6h } = await supabase
      .from('matches')
      .select(`
        id, sender_email, compliance_locked_at,
        sender_trip:sender_trip_id(from_city, to_city)
      `)
      .eq('status', 'locked_pending_compliance')
      .lt('compliance_locked_at', cutoff42h)
      .gte('compliance_locked_at', cutoff48h)
      .is('compliance_reminder_6h_sent_at', null);

    for (const match of due6h ?? []) {
      const trip     = Array.isArray(match.sender_trip) ? match.sender_trip[0] : (match.sender_trip as any);
      const fromCity = trip?.from_city ?? '';
      const toCity   = trip?.to_city   ?? '';

      await Promise.allSettled([
        match.sender_email && sendDeclarationPromptEmail({
          toEmail: match.sender_email, fromCity, toCity, matchId: match.id, hoursRemaining: 6,
        }),
        supabase.from('matches').update({ compliance_reminder_6h_sent_at: new Date().toISOString() }).eq('id', match.id),
      ]);

      results.reminders_6h++;
    }

    // ── 1c. 24h reminder — locked 24h+ ago, not in 6h window yet, no 24h reminder ─
    const { data: due24h } = await supabase
      .from('matches')
      .select(`
        id, sender_email, compliance_locked_at,
        sender_trip:sender_trip_id(from_city, to_city)
      `)
      .eq('status', 'locked_pending_compliance')
      .lt('compliance_locked_at', cutoff24h)
      .gte('compliance_locked_at', cutoff42h)  // not yet in 6h window
      .is('compliance_reminder_24h_sent_at', null);

    for (const match of due24h ?? []) {
      const trip     = Array.isArray(match.sender_trip) ? match.sender_trip[0] : (match.sender_trip as any);
      const fromCity = trip?.from_city ?? '';
      const toCity   = trip?.to_city   ?? '';

      await Promise.allSettled([
        match.sender_email && sendDeclarationPromptEmail({
          toEmail: match.sender_email, fromCity, toCity, matchId: match.id, hoursRemaining: 24,
        }),
        supabase.from('matches').update({ compliance_reminder_24h_sent_at: new Date().toISOString() }).eq('id', match.id),
      ]);

      results.reminders_24h++;
    }

    // ── 2. compliance_in_progress > 24h → escalate to admin ─────────────────
    const { data: reviewOverdue } = await supabase
      .from('matches')
      .select(`
        id, sender_email, declaration_id, compliance_review_started_at,
        sender_trip:sender_trip_id(from_city, to_city)
      `)
      .eq('status', 'compliance_in_progress')
      .lt('compliance_review_started_at', cutoffReview24h);

    for (const match of reviewOverdue ?? []) {
      const trip     = Array.isArray(match.sender_trip) ? match.sender_trip[0] : (match.sender_trip as any);
      const fromCity = trip?.from_city ?? '';
      const toCity   = trip?.to_city   ?? '';

      await sendResendEmail({
        from,
        to:      adminEmail,
        subject: `[COMPLIANCE] Review overdue >24h — ${fromCity} → ${toCity} — Match ${match.id}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <div style="margin-bottom:16px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
          <h2 style="color:#dc2626;">⚠️ Compliance review overdue</h2>
          <p>The compliance review for match <strong>${match.id}</strong> (${fromCity} → ${toCity}) has been in <code>compliance_in_progress</code> for more than 24 hours. Please review and approve or reject immediately.</p>
          <p><strong>Sender:</strong> ${match.sender_email}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/compliance/${match.id}" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Review now →</a></p>
        </div>`,
        text: `Compliance review overdue for match ${match.id} (${fromCity} → ${toCity}). Review: ${process.env.NEXT_PUBLIC_APP_URL}/admin/compliance/${match.id}`,
      }).catch(() => {});

      results.review_escalated++;
    }

    return NextResponse.json({ ok: true, ...results });

  } catch (error) {
    console.error('compliance-sla cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
