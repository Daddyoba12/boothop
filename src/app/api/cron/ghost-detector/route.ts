import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';

const GHOST_THRESHOLD_HOURS = 48;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';


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
  return runGhostDetector();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runGhostDetector();
}

async function runGhostDetector() {
  const supabase = createSupabaseAdminClient();
  const cutoff   = new Date(Date.now() - GHOST_THRESHOLD_HOURS * 3_600_000).toISOString();

  // Find active/escrowed matches that were activated more than 48h ago
  const { data: activeMatches } = await supabase
    .from('matches')
    .select('id, traveler_email, sender_email, payment_confirmed_at, ghost_flagged_at')
    .in('status', ['active', 'escrowed'])
    .is('ghost_flagged_at', null)
    .lt('payment_confirmed_at', cutoff);

  if (!activeMatches?.length) {
    return NextResponse.json({ ok: true, checked: 0, ghosts: 0 });
  }

  let ghostCount = 0;

  for (const match of activeMatches) {
    // Skip if there is any tracking activity in the last 48h
    const [{ count: checkpoints }, { count: locRequests }] = await Promise.all([
      supabase
        .from('tracking_checkpoints')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .gte('created_at', cutoff),
      supabase
        .from('location_requests')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .gte('created_at', cutoff),
    ]);

    if ((checkpoints ?? 0) > 0 || (locRequests ?? 0) > 0) continue;

    // Skip if an open ghost incident already exists for this match
    const { data: existing } = await supabase
      .from('ghost_incidents')
      .select('id')
      .eq('match_id', match.id)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) continue;

    ghostCount++;

    // Create ghost incident
    await supabase.from('ghost_incidents').insert({
      match_id:        match.id,
      traveller_email: match.traveler_email,
      notified_at:     new Date().toISOString(),
    });

    // Flag the match
    await supabase.from('matches').update({
      ghost_flagged_at: new Date().toISOString(),
      status:           'ghost_flagged',
    }).eq('id', match.id);

    // Admin alert record
    await supabase.from('admin_alerts').insert({
      alert_type: 'ghost_traveller',
      match_id:   match.id,
      email:      match.traveler_email,
      message:    `Ghost traveller detected. Match ${match.id} — traveller ${match.traveler_email} silent for ${GHOST_THRESHOLD_HOURS}h.`,
      metadata:   { match_id: match.id, traveller_email: match.traveler_email },
    });

    // Notify sender
    if (match.sender_email) {
      sendResendEmail({
        from:    'BootHop Support <noreply@boothop.com>',
        to:      [match.sender_email],
        subject: 'Update on your delivery — traveller unresponsive',
        text: [
          'Dear BootHop sender,',
          '',
          'We noticed your traveller has not updated their delivery status or location in the last 48 hours.',
          'Our team has been alerted and is actively monitoring this delivery.',
          '',
          `You can check your match at: ${APP_URL}/dashboard`,
          '',
          'If you have urgent concerns, please reply to this email immediately.',
          '',
          '— The BootHop Team',
        ].join('\n'),
      }).catch(() => {});
    }

    // Notify traveller
    if (match.traveler_email) {
      sendResendEmail({
        from:    'BootHop Support <noreply@boothop.com>',
        to:      [match.traveler_email],
        subject: 'Action required — please update your delivery status',
        text: [
          'Dear BootHop traveller,',
          '',
          'We have not received any tracking update from you in the last 48 hours.',
          'Please log in immediately and update your delivery status to avoid account review.',
          '',
          `Update your status here: ${APP_URL}/dashboard`,
          '',
          '— The BootHop Team',
        ].join('\n'),
      }).catch(() => {});
    }
  }

  // Admin summary email if any ghosts found
  if (ghostCount > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
    sendResendEmail({
      from:    'BootHop Support <noreply@boothop.com>',
      to:      [adminEmail],
      subject: `⚠️ Ghost detector: ${ghostCount} silent traveller${ghostCount > 1 ? 's' : ''} detected`,
      text: `${ghostCount} match(es) flagged as ghost incidents. Check admin_alerts table or visit ${APP_URL}/admin.`,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:        true,
    checked:   activeMatches.length,
    ghosts:    ghostCount,
    timestamp: new Date().toISOString(),
  });
}
