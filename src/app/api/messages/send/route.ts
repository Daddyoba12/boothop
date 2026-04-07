import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

// Patterns that would allow users to share contact details outside the platform
const BLOCKED_PATTERNS = [
  /\b\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d\b/, // 10+ digit phone
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,                                               // email address
  /whatsapp|telegram|signal|snapchat|instagram|facebook|messenger/i,                                       // messaging apps
  /\+44\s?\d|07\d{3}[\s\-]?\d{3}[\s\-]?\d{3}/,                                                           // UK phone numbers
];

function containsBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}

// Only active matches can message
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

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email')
      .eq('id', matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (!MESSAGING_STATUSES.includes(match.status)) {
      return NextResponse.json({
        error: 'Messaging is only available once your match is active and contact details have been released.',
      }, { status: 400 });
    }

    const isFlagged = containsBlockedContent(content.trim());

    const { data: message, error: insertErr } = await supabase
      .from('match_messages')
      .insert({
        match_id:   matchId,
        sender_email: email,
        content:    content.trim(),
        is_flagged: isFlagged,
      })
      .select('id, content, sender_email, is_flagged, created_at')
      .single();

    if (insertErr || !message) {
      throw new Error('Failed to send message.');
    }

    if (isFlagged) {
      // Still delivers but notify admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
      const appUrl     = process.env.NEXT_PUBLIC_APP_URL || '';
      const { Resend }  = await import('resend');
      const resend      = new Resend(process.env.RESEND_API_KEY);
      const from        = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

      resend.emails.send({
        from,
        to: adminEmail,
        subject: `[FLAGGED MESSAGE] Match ${matchId}`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px;">
            <h2>Flagged message detected</h2>
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Match:</strong> ${matchId}</p>
            <p><strong>Content:</strong></p>
            <blockquote style="border-left:4px solid #dc2626;padding:8px 16px;background:#fef2f2;">${content.trim()}</blockquote>
            <p>Message was delivered but flagged for review.</p>
          </div>
        `,
        text: `Flagged message from ${email} on match ${matchId}:\n\n${content.trim()}`,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, message });

  } catch (error) {
    console.error('messages/send error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
