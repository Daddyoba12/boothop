import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

function cancellationEmail(route: string, travelDate: string, reason: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f1923;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#0d3b4f,#0a2535);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:3px solid #ef4444;">
        <div style="font-size:28px;font-weight:900;color:#fff;">✈️ Boot<span style="color:#00b4d8;">Hop</span></div>
      </td></tr>
      <tr><td style="background:#132030;padding:40px;border-radius:0 0 16px 16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">Journey Cancelled</h1>
          <p style="color:#7dd3e8;font-size:15px;margin:0;">An admin has cancelled this journey listing</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2a3d;border-radius:12px;margin:24px 0;border:1px solid #1e3f5a;">
          <tr>
            <td style="padding:12px 16px;color:#7dd3e8;font-size:13px;font-weight:600;width:35%;">Route</td>
            <td style="padding:12px 16px;color:#fff;font-size:14px;">${route}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#7dd3e8;font-size:13px;font-weight:600;border-top:1px solid #1e3f5a;">Date</td>
            <td style="padding:12px 16px;color:#fff;font-size:14px;border-top:1px solid #1e3f5a;">${travelDate}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#f59e0b;font-size:13px;font-weight:600;border-top:1px solid #1e3f5a;">Reason</td>
            <td style="padding:12px 16px;color:#fcd34d;font-size:14px;border-top:1px solid #1e3f5a;">${reason}</td>
          </tr>
        </table>
        <p style="color:#b8d4e3;font-size:15px;line-height:1.7;">Any linked matches have also been cancelled. If you have questions, contact us at <a href="mailto:info@boothop.com" style="color:#00b4d8;">info@boothop.com</a></p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${APP_URL}/dashboard" style="background:linear-gradient(135deg,#00b4d8,#0077b6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;display:inline-block;">View Dashboard</a>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #1e3448;padding-top:20px;">
          <tr><td style="text-align:center;color:#4a7a99;font-size:12px;">© ${new Date().getFullYear()} BootHop Ltd.</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { reason } = await request.json();

  if (!reason || reason.trim().length < 10) {
    return NextResponse.json(
      { error: 'A reason of at least 10 characters is required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  // 1. Fetch the trip
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (tripErr || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // 2. Fetch all related matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, sender_trip_id, traveler_trip_id')
    .or(`sender_trip_id.eq.${id},traveler_trip_id.eq.${id}`);

  // 3. Collect counterparty trip IDs
  const otherTripIds = (matches || [])
    .map((m) => (m.sender_trip_id === id ? m.traveler_trip_id : m.sender_trip_id))
    .filter(Boolean) as string[];

  // 4. Fetch counterparty emails
  const { data: otherTrips } =
    otherTripIds.length > 0
      ? await supabase.from('trips').select('email').in('id', otherTripIds)
      : { data: [] };

  // 5. Build email set
  const affectedEmails = new Set<string>();
  if (trip.email) affectedEmails.add(trip.email);
  for (const t of otherTrips || []) {
    if (t.email) affectedEmails.add(t.email);
  }

  // 6. Cancel the trip
  await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id);

  // 7. Cancel non-terminal matches
  const activeMatchIds = (matches || [])
    .filter((m) => !['completed', 'cancelled'].includes(m.status))
    .map((m) => m.id);

  if (activeMatchIds.length > 0) {
    await supabase.from('matches').update({ status: 'cancelled' }).in('id', activeMatchIds);
  }

  // 8. Notify all affected parties
  const route = `${trip.from_city} → ${trip.to_city}`;
  const dateStr = trip.travel_date
    ? new Date(trip.travel_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'N/A';

  const html = cancellationEmail(route, dateStr, reason);

  await Promise.allSettled(
    Array.from(affectedEmails).map((email) =>
      sendEmail({
        to: email,
        subject: `Journey cancelled — ${route} | BootHop`,
        html,
      })
    )
  );

  return NextResponse.json({
    ok: true,
    notified: affectedEmails.size,
    matchesCancelled: activeMatchIds.length,
  });
}
