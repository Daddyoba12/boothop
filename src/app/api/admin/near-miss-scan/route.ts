import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ADMIN_EMAILS } from '@/lib/auth/admin';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

function isAuthorized(req: NextRequest, session: { email: string } | null): boolean {
  if (session && ADMIN_EMAILS.includes(session.email)) return true;
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

function daysDiff(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function normalise(city: string | null | undefined): string {
  return (city || '').toLowerCase().trim();
}

function buildEmail(params: {
  from_city: string;
  to_city: string;
  senderDate: string;
  travellerDate: string;
  daysDiff: number;
}): { subject: string; html: string; text: string } {
  const { from_city, to_city, senderDate, travellerDate, daysDiff: diff } = params;

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

  const senderFmt    = fmtDate(senderDate);
  const travellerFmt = fmtDate(travellerDate);
  const earlier      = new Date(travellerDate) < new Date(senderDate) ? 'earlier' : 'later';

  const subject = `Near match found for your ${from_city} → ${to_city} listing`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
            <img src="${appUrl}/images/boothop-logo.png" alt="BootHop" height="48"
                 style="height:48px;display:inline-block;" onerror="this.style.display='none'" />
            <div style="margin-top:8px;">
              <span style="font-size:28px;font-weight:900;color:#ffffff;">Boot</span><span style="font-size:28px;font-weight:900;color:#93c5fd;">Hop</span>
            </div>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Connecting senders &amp; travellers worldwide</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">
              We found a near match for you!
            </h2>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
              Good news — we have a traveller heading from
              <strong>${from_city}</strong> to <strong>${to_city}</strong>, and their travel date
              is only <strong>${diff} day${diff > 1 ? 's' : ''} ${earlier}</strong> than your listed date.
            </p>

            <!-- Date comparison box -->
            <table width="100%" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 24px;">
              <tr style="background:#f8fafc;">
                <td style="padding:16px 20px;border-right:1px solid #e2e8f0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Your listed date</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${senderFmt}</p>
                </td>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Traveller&apos;s date</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#2563eb;">${travellerFmt}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
              If you can be flexible by ${diff} day${diff > 1 ? 's' : ''}, we can connect you with this traveller
              right away. Simply update your travel date in your dashboard, or reply to this email and our
              team will arrange it for you.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#64748b;">
              If your date is fixed and cannot change, no action is needed — we will keep looking
              for the perfect match.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${appUrl}/dashboard"
               style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
              Update My Date &rarr;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} BootHop &bull;
              <a href="${appUrl}" style="color:#2563eb;text-decoration:none;">www.boothop.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `We found a near match for your ${from_city} → ${to_city} listing!`,
    '',
    `We have a traveller heading on the same route, but their date is ${diff} day${diff > 1 ? 's' : ''} ${earlier} than yours.`,
    '',
    `Your date:       ${senderFmt}`,
    `Traveller date:  ${travellerFmt}`,
    '',
    `If you can be flexible, visit your dashboard to update your date: ${appUrl}/dashboard`,
    '',
    'If your date is fixed, no action needed — we will keep looking.',
    '',
    'The BootHop Team',
  ].join('\n');

  return { subject, html, text };
}

async function runScan() {
  const supabase = createSupabaseAdminClient();
  const today    = new Date().toISOString().split('T')[0];

  const [sendersRes, travellersRes, matchesRes] = await Promise.all([
    supabase
      .from('trips')
      .select('id, email, from_city, to_city, from_city_en, to_city_en, travel_date')
      .eq('type', 'sender')
      .eq('status', 'active')
      .gte('travel_date', today),

    supabase
      .from('trips')
      .select('id, email, from_city, to_city, from_city_en, to_city_en, travel_date')
      .eq('type', 'travel')
      .eq('status', 'active')
      .gte('travel_date', today),

    supabase
      .from('matches')
      .select('sender_trip_id, traveler_trip_id')
      .not('status', 'in', '("cancelled","declined")'),
  ]);

  const senders     = sendersRes.data     || [];
  const travellers  = travellersRes.data  || [];
  const matches     = matchesRes.data     || [];

  const matchedSenderIds    = new Set(matches.map((m: any) => m.sender_trip_id));
  const matchedTravellerIds = new Set(matches.map((m: any) => m.traveler_trip_id));

  const freeSenders    = senders.filter((s: any)    => !matchedSenderIds.has(s.id));
  const freeTravellers = travellers.filter((t: any) => !matchedTravellerIds.has(t.id));

  // Find best near-miss per sender email
  type Pair = { sender: any; traveller: any; diff: number };
  const byEmail = new Map<string, Pair>();

  for (const sender of freeSenders) {
    if (!sender.email) continue;
    const fromS = normalise(sender.from_city_en || sender.from_city);
    const toS   = normalise(sender.to_city_en   || sender.to_city);

    for (const trav of freeTravellers) {
      const fromT = normalise(trav.from_city_en || trav.from_city);
      const toT   = normalise(trav.to_city_en   || trav.to_city);

      if (fromS !== fromT || toS !== toT) continue;

      const diff = daysDiff(sender.travel_date, trav.travel_date);
      if (diff < 1 || diff > 2) continue;

      const existing = byEmail.get(sender.email);
      if (!existing || diff < existing.diff) {
        byEmail.set(sender.email, { sender, traveller: trav, diff });
      }
    }
  }

  if (byEmail.size === 0) {
    return NextResponse.json({ pairs: 0, sent: 0, message: 'No near-miss pairs found.' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  let sent = 0;
  let failed = 0;

  const previews: any[] = [];

  for (const [email, { sender, traveller, diff }] of byEmail) {
    const { subject, html, text } = buildEmail({
      from_city:     sender.from_city,
      to_city:       sender.to_city,
      senderDate:    sender.travel_date,
      travellerDate: traveller.travel_date,
      daysDiff:      diff,
    });

    const result = await resend.emails.send({ from, to: email, subject, html, text });
    if ((result as any).error) { failed++; } else { sent++; }

    previews.push({
      email,
      route:          `${sender.from_city} → ${sender.to_city}`,
      sender_date:    sender.travel_date,
      traveller_date: traveller.travel_date,
      days_diff:      diff,
    });
  }

  return NextResponse.json({ pairs: byEmail.size, sent, failed, previews });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session     = getAppSession(cookieStore);

  if (!isAuthorized(request, session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runScan();
}

// Allow cron to call via GET
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runScan();
}
