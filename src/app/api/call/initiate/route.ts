import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

// BootHop Call — masked calling via Telnyx.
// Neither party's real number is revealed. Calls are logged for dispute evidence.
// Requires TELNYX_API_KEY and TELNYX_APP_ID in env.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session     = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) return NextResponse.json({ error: 'matchId required.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const email    = session.email;

    const { data: match } = await supabase
      .from('matches')
      .select('id, status, sender_email, traveler_email, locked_at')
      .eq('id', matchId)
      .maybeSingle();

    if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });

    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    if (match.locked_at) {
      const ms = Date.now() - new Date(match.locked_at).getTime();
      if (ms >= 7 * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: 'This conversation is archived.' }, { status: 403 });
      }
    }

    const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
    const TELNYX_APP_ID  = process.env.TELNYX_CONNECTION_ID;  // Telnyx Call Control App ID
    const TELNYX_NUMBER  = process.env.TELNYX_PHONE_NUMBER;

    if (!TELNYX_API_KEY || !TELNYX_APP_ID || !TELNYX_NUMBER) {
      return NextResponse.json({
        error: 'BootHop Call is not yet configured for this environment.',
        code:  'CALL_NOT_CONFIGURED',
      }, { status: 503 });
    }

    // Get caller's phone from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('email', email)
      .maybeSingle();

    if (!profile?.phone) {
      return NextResponse.json({
        error: 'Add a verified phone number to your profile to use BootHop Call.',
        code:  'NO_PHONE',
      }, { status: 400 });
    }

    // Initiate Telnyx call — caller dials our Telnyx number, which bridges to the other party
    const telnyxResp = await fetch('https://api.telnyx.com/v2/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        connection_id:  TELNYX_APP_ID,
        to:             profile.phone,
        from:           TELNYX_NUMBER,
        from_display_name: 'BootHop',
        client_state:   Buffer.from(JSON.stringify({ matchId, callerEmail: email })).toString('base64'),
      }),
    });

    if (!telnyxResp.ok) {
      const err = await telnyxResp.json();
      console.error('Telnyx error:', err);
      throw new Error('Failed to initiate call.');
    }

    const callData = await telnyxResp.json();
    const callId   = callData?.data?.call_control_id ?? null;

    // Log the call for audit trail (non-fatal)
    try {
      await supabase.from('call_logs').insert({
        match_id:     matchId,
        caller_email: email,
        call_id:      callId,
        status:       'initiated',
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ ok: true, callId, message: 'BootHop is connecting your call. Neither party\'s number will be shared.' });

  } catch (error) {
    console.error('call/initiate error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
