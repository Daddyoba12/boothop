import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSessionCookieName, verifyAppSession } from '@/lib/auth/session';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const session = verifyAppSession(token);
    const { draftId } = await request.json();
    if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();

    // Fetch draft and verify ownership
    const { data: draft } = await supabase
      .from('journey_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('email', session.email)
      .eq('status', 'draft')
      .single();

    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // Look up the user_id from auth (needed for trips table)
    let userId = draft.user_id;
    if (!userId) {
      const { data: authUser } = await (supabase.auth.admin as any).getUserByEmail(session.email).catch(() => ({ data: null }));
      userId = authUser?.user?.id || null;
    }
    if (!userId) return NextResponse.json({ error: 'User account not found — please contact support' }, { status: 400 });

    // Insert into trips
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert({
        user_id:     userId,
        type:        draft.type,
        from_city:   draft.from_city,
        to_city:     draft.to_city,
        travel_date: draft.travel_date,
        weight:      draft.weight,
        price:       draft.price,
        status:      'active',
      })
      .select()
      .single();

    if (tripErr || !trip) throw tripErr || new Error('Failed to create trip');

    // Mark draft as published
    await supabase.from('journey_drafts').update({ status: 'published' }).eq('id', draftId);

    // Notify support of new trip (non-blocking)
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@boothop.com';
    const typeLabel    = draft.type === 'travel' ? 'Booter (traveller)' : 'Hooper (sender)';
    const resend       = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
      to:      supportEmail,
      subject: `🚀 New trip registered — ${draft.from_city} → ${draft.to_city} (${typeLabel})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
          <div style="margin-bottom:20px;">
            <span style="font-size:20px;font-weight:900;color:#059669;">Boot</span><span style="font-size:20px;font-weight:900;color:#10b981;">Hop</span>
          </div>
          <span style="font-size:11px;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New Trip</span>
          <h2 style="margin:16px 0 20px;font-size:18px;font-weight:700;">New trip registered on BootHop</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:7px 0;color:#64748b;width:140px;">Type</td><td style="padding:7px 0;font-weight:600;">${typeLabel}</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Email</td><td style="padding:7px 0;">${session.email}</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Route</td><td style="padding:7px 0;font-weight:600;">${draft.from_city} → ${draft.to_city}</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Date</td><td style="padding:7px 0;">${draft.travel_date}</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Weight</td><td style="padding:7px 0;">${draft.weight || '—'} kg</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Price</td><td style="padding:7px 0;font-weight:700;color:#059669;">£${draft.price || '—'}</td></tr>
            <tr><td style="padding:7px 0;color:#64748b;">Trip ID</td><td style="padding:7px 0;font-family:monospace;font-size:12px;">${trip.id}</td></tr>
          </table>
        </div>
      `,
      text: `New trip: ${draft.type} | ${draft.from_city} → ${draft.to_city} | ${draft.travel_date} | ${session.email}`,
    }).catch(e => console.error('Trip notification email error:', e));

    // Run match engine (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    fetch(`${appUrl}/api/match-engine`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tripId: trip.id }),
    }).catch(e => console.error('Match engine error (non-blocking):', e));

    return NextResponse.json({ ok: true, tripId: trip.id });

  } catch (error) {
    console.error('publish-draft error:', error);
    return NextResponse.json({ error: 'Failed to publish draft' }, { status: 500 });
  }
}
