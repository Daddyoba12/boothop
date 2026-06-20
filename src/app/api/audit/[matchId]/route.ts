import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { isAdminEmail } from '@/lib/auth/admin';

// Phase 4 — enterprise audit trail export.
// Returns a complete record of events for a match: messages, calls, attachments,
// contact-sharing attempts, and match status history.
// Used by compliance teams and dispute resolution.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const cookieStore   = await cookies();
    const session       = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId } = await params;
    const supabase    = createSupabaseAdminClient();
    const email       = session.email;

    const { data: match } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, locked_at, agreed_price, created_at')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    const isAdmin       = isAdminEmail(email);
    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Fetch all audit components in parallel
    const [messages, calls, attachments, contactAttempts] = await Promise.all([
      supabase
        .from('match_messages')
        .select('id, sender_email, content, is_flagged, is_blocked, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .then(r => r.data ?? []),

      supabase
        .from('call_logs')
        .select('id, caller_email, call_id, status, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .then(r => r.data ?? []),

      supabase
        .from('message_attachments')
        .select('id, uploader_email, label, file_type, file_size, public_url, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .then(r => r.data ?? []),

      isAdmin
        ? supabase
            .from('contact_attempts')
            .select('id, sender_email, content, created_at')
            .eq('match_id', matchId)
            .order('created_at', { ascending: true })
            .then(r => r.data ?? [])
        : Promise.resolve([]),
    ]);

    const shipmentId = `BH-${matchId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      shipmentId,
      match: {
        id:           match.id,
        status:       match.status,
        senderEmail:  match.sender_email,
        travelerEmail: match.traveler_email,
        agreedPrice:  match.agreed_price,
        lockedAt:     match.locked_at,
        createdAt:    match.created_at,
      },
      summary: {
        messageCount:        messages.length,
        callCount:           calls.length,
        attachmentCount:     attachments.length,
        contactAttempts:     isAdmin ? contactAttempts.length : undefined,
      },
      messages,
      calls,
      attachments,
      ...(isAdmin ? { contactAttempts } : {}),
      exportedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('audit error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
