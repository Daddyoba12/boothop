/**
 * POST /api/matches/[id]/delivery/report-issue
 *
 * Sender raises an issue within the 24-hour window after delivery confirmation.
 * Creates a dispute with status 'open', which the existing auto-payout cron
 * automatically skips — funds stay held until admin resolves the dispute.
 *
 * Window: delivery_confirmed_at + 24h. After the window, the auto-payout cron
 * has already released funds and the match is 'completed'.
 *
 * Only applies to sealed shipments that used confirm-pin for delivery.
 * CLEARED-path shipments (no seal) raise disputes via /api/disputes/create.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendSMS } from '@/lib/services/telnyx';
import { sendResendEmail } from '@/lib/resend-client';

const ISSUE_TYPES = ['damaged', 'missing', 'wrong_item', 'other'] as const;
type IssueType = typeof ISSUE_TYPES[number];

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, sender_email, traveler_email,
      delivery_confirmed_at,
      agreed_price,
      sender_trip:sender_trip_id(from_city, to_city)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.sender_email !== session.email) {
    return NextResponse.json({ error: 'Only the sender can report a delivery issue' }, { status: 403 });
  }

  if (match.status === 'completed') {
    return NextResponse.json({
      error: 'Payment has already been released. The window to report an issue has passed.',
    }, { status: 410 });
  }
  if (match.status === 'disputed') {
    return NextResponse.json({ error: 'There is already an open dispute for this match.' }, { status: 409 });
  }
  if (match.status !== 'delivery_confirmed') {
    return NextResponse.json({
      error: 'Issues can only be reported after delivery is confirmed.',
    }, { status: 409 });
  }

  // Check the 24-hour window using delivery_confirmed_at (set by confirm-pin)
  if (!match.delivery_confirmed_at) {
    return NextResponse.json({
      error: 'Delivery was not confirmed via the PIN flow. Use /api/disputes/create to raise a dispute.',
    }, { status: 409 });
  }

  const windowEnd = new Date(match.delivery_confirmed_at).getTime() + WINDOW_MS;
  if (Date.now() > windowEnd) {
    return NextResponse.json({
      error: 'The 24-hour dispute window has passed. Funds have been scheduled for release.',
    }, { status: 410 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { issue_type, description, photo_url } = body as {
    issue_type?: unknown; description?: unknown; photo_url?: unknown;
  };

  if (!issue_type || !ISSUE_TYPES.includes(issue_type as IssueType)) {
    return NextResponse.json({
      error: `issue_type is required. Valid values: ${ISSUE_TYPES.join(', ')}`,
    }, { status: 422 });
  }
  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    return NextResponse.json({
      error: 'description is required (minimum 20 characters)',
    }, { status: 422 });
  }

  // Guard: no existing open dispute
  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('match_id', matchId)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'There is already an open dispute for this match.' }, { status: 409 });
  }

  const nowIso = new Date().toISOString();

  // Create dispute — auto-payout cron skips matches with status='open' disputes
  const { data: dispute, error: insertErr } = await supabase
    .from('disputes')
    .insert({
      match_id:    matchId,
      raised_by:   match.sender_email,
      reason:      issue_type as string,
      description: (description as string).trim(),
      status:      'open',
    })
    .select('id')
    .single();

  if (insertErr || !dispute) {
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }

  // Transition match to disputed — auto-payout only looks for delivery_confirmed
  await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId);

  await supabase.from('shipment_events').insert([
    {
      match_id:     matchId,
      event_type:   'DELIVERY_ISSUE_REPORTED',
      performed_by: match.sender_email,
      metadata:     { issue_type, description: (description as string).trim(), photo_url: photo_url ?? null, dispute_id: dispute.id },
    },
    {
      match_id:     matchId,
      event_type:   'DISPUTE_AUTO_OPENED',
      performed_by: 'system',
      metadata:     { dispute_id: dispute.id, source: 'delivery_issue_report' },
    },
  ]);

  const trip      = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : (match.sender_trip as any);
  const fromCity  = trip?.from_city ?? '';
  const toCity    = trip?.to_city   ?? '';
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
  const adminPhone = process.env.ADMIN_PHONE;

  const reasonLabel: Record<string, string> = {
    damaged:    'Item damaged',
    missing:    'Item not received / missing',
    wrong_item: 'Wrong item delivered',
    other:      'Other',
  };

  await Promise.allSettled([
    adminPhone && sendSMS(adminPhone,
      `[BOOTHOP DISPUTE] ${fromCity}→${toCity} Issue:${issue_type} Sender:${match.sender_email} Match:${matchId}`
    ).catch(() => {}),
    sendResendEmail({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      adminEmail,
      subject: `[DELIVERY DISPUTE] ${reasonLabel[issue_type as string] ?? issue_type} — Match ${matchId}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:16px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
        <h2 style="color:#dc2626;">⚠️ Delivery dispute opened</h2>
        <p><strong>Route:</strong> ${fromCity} → ${toCity}</p>
        <p><strong>Issue:</strong> ${reasonLabel[issue_type as string] ?? issue_type}</p>
        <p><strong>Sender:</strong> ${match.sender_email}</p>
        <p><strong>Carrier:</strong> ${match.traveler_email}</p>
        <p><strong>Description:</strong> ${(description as string).trim()}</p>
        ${photo_url ? `<p><strong>Photo:</strong> <a href="${photo_url}">View</a></p>` : ''}
        <a href="${appUrl}/admin/compliance/${matchId}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Review dispute →</a>
      </div>`,
      text: `Delivery dispute for match ${matchId} (${fromCity}→${toCity}). Issue: ${issue_type}. Sender: ${match.sender_email}. Description: ${(description as string).trim()}`,
    }).catch(() => {}),
    sendResendEmail({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      match.traveler_email,
      subject: `⚠️ Delivery dispute raised — ${fromCity} → ${toCity}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:16px;"><span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span></div>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Delivery dispute raised</h2>
        <p style="color:#475569;">The sender has reported an issue with your ${fromCity} → ${toCity} delivery. Payment is on hold while BootHop reviews.</p>
        <p><strong>Issue reported:</strong> ${reasonLabel[issue_type as string] ?? issue_type}</p>
        <p style="font-size:13px;color:#64748b;">Our team will be in touch. In the meantime, please keep all evidence (photos, receipts, messages) available.</p>
      </div>`,
      text: `The sender has raised a delivery dispute for ${fromCity} → ${toCity}. Issue: ${issue_type}. Payment is on hold. BootHop will be in touch.`,
    }).catch(() => {}),
  ]);

  return NextResponse.json({ ok: true, disputeId: dispute.id, status: 'disputed' });
}
