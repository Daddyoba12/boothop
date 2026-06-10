import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { checkMessageLimit, checkGlobalMessageLimit } from '@/lib/rate-limit';
import { moderateText } from '@/lib/moderation';

// ── Contact-sharing patterns — message is BLOCKED (not delivered) ────────────
const CONTACT_PATTERNS = [
  /\b\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d\b/, // 10+ digit number
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,                                              // email
  /\+44\s?\d|07\d{3}[\s\-]?\d{3}[\s\-]?\d{3}/,                                                          // UK mobile
  /whatsapp|telegram|signal|snapchat|instagram|facebook|messenger|wechat|line\b/i,                        // messaging apps
  /\bwa\.me\b|\bt\.me\b/i,                                                                                // direct links
  /my number|my email|call me|text me|ring me|dm me|direct message/i,                                     // soliciting contact
];

function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

const MESSAGING_STATUSES = ['active', 'delivery_confirmed', 'disputed'];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId, content } = await request.json();

    if (!matchId || !content?.trim()) {
      return NextResponse.json({ error: 'matchId and content are required.' }, { status: 400 });
    }
    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters).' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    // ── Rate limiting ────────────────────────────────────────────────────────
    const [perMatch, global] = await Promise.all([
      checkMessageLimit(email, matchId),
      checkGlobalMessageLimit(email),
    ]);

    if (!perMatch.allowed) {
      return NextResponse.json({
        error: `Too many messages. Please wait ${perMatch.retryAfter}s before sending again.`,
        code:  'RATE_LIMITED',
      }, { status: 429 });
    }
    if (!global.allowed) {
      return NextResponse.json({
        error: `Hourly message limit reached. Please wait ${global.retryAfter}s.`,
        code:  'RATE_LIMITED',
      }, { status: 429 });
    }

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, locked_at')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // ── Thread lock check (Phase 3) ──────────────────────────────────────────
    if (match.locked_at) {
      const lockedMs  = Date.now() - new Date(match.locked_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (lockedMs >= sevenDays) {
        return NextResponse.json({
          error: 'This conversation has been archived. The 7-day dispute window has closed.',
          code:  'THREAD_LOCKED',
        }, { status: 403 });
      }
    }

    if (!MESSAGING_STATUSES.includes(match.status)) {
      return NextResponse.json({
        error: 'Messaging is only available once your match is active.',
      }, { status: 400 });
    }

    // ── AI Contact Blocking (Phase 1) ────────────────────────────────────────
    if (containsContactInfo(content.trim())) {
      try {
        await supabase.from('contact_attempts').insert({
          match_id:     matchId,
          sender_email: email,
          content:      content.trim(),
        });
      } catch { /* non-fatal */ }

      const { Resend } = await import('resend');
      const resend     = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
        to:      process.env.ADMIN_EMAIL     || 'admin@boothop.com',
        subject: `[BLOCKED] Contact-sharing attempt — Match ${matchId}`,
        html: `<p><strong>From:</strong> ${email}</p><p><strong>Match:</strong> ${matchId}</p><blockquote>${content.trim()}</blockquote><p>Message was <strong>blocked</strong> and not delivered.</p>`,
        text: `Blocked contact-sharing attempt from ${email} on match ${matchId}:\n\n${content.trim()}`,
      }).catch(console.error);

      return NextResponse.json({
        error:   'Sharing personal contact details is prohibited and may void BootHop protection. Please keep all communication within BootHop.',
        code:    'CONTACT_BLOCKED',
        blocked: true,
      }, { status: 403 });
    }

    // ── Content moderation (flag harmful text, still deliver) ────────────────
    const moderation  = moderateText(content.trim());
    const isFlagged   = moderation.flagged;

    if (isFlagged) {
      // Alert admin asynchronously — don't block delivery
      const { Resend } = await import('resend');
      new Resend(process.env.RESEND_API_KEY).emails.send({
        from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
        to:      process.env.ADMIN_EMAIL     || 'admin@boothop.com',
        subject: `[FLAGGED:${moderation.category}] Message — Match ${matchId}`,
        html: `<p><strong>From:</strong> ${email}</p><p><strong>Match:</strong> ${matchId}</p><p><strong>Category:</strong> ${moderation.category}</p><blockquote>${content.trim()}</blockquote><p>Message was <strong>delivered</strong> but flagged for review.</p>`,
        text: `Flagged message (${moderation.category}) from ${email} on match ${matchId}:\n\n${content.trim()}`,
      }).catch(console.error);
    }

    const { data: message, error: insertErr } = await supabase
      .from('match_messages')
      .insert({
        match_id:     matchId,
        sender_email: email,
        content:      content.trim(),
        is_flagged:   isFlagged,
        is_blocked:   false,
      })
      .select('id, content, sender_email, is_flagged, is_blocked, created_at')
      .single();

    if (insertErr || !message) {
      throw new Error('Failed to send message.');
    }

    return NextResponse.json({ ok: true, message });

  } catch (error) {
    console.error('messages/send error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
