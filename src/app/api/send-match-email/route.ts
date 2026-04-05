import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'BootHop <noreply@boothop.com>';

async function createActionToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  action_type: string,
  entity_id: string,
  payload: object,
  hoursValid = 72
) {
  const expires_at = new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type, entity_id, payload, expires_at })
    .select('token')
    .single();
  return data?.token as string;
}

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json();
    const supabase = createSupabaseAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.com';

    const { data: match } = await supabase
      .from('matches')
      .select(`*, sender_trip:sender_trip_id(*), traveler_trip:traveler_trip_id(*)`)
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const route = `${match.sender_trip.from_city} → ${match.sender_trip.to_city}`;
    const date  = new Date((match.sender_trip.travel_date || match.traveler_trip.travel_date) + 'T00:00:00')
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const price = match.agreed_price ? `£${match.agreed_price}` : 'To be agreed';

    // Get emails from auth — fall back to trip email if stored there
    const { data: senderAuth }   = await supabase.auth.admin.getUserById(match.sender_user_id).catch(() => ({ data: null }));
    const { data: travelerAuth } = await supabase.auth.admin.getUserById(match.traveler_user_id).catch(() => ({ data: null }));

    const senderEmail   = senderAuth?.user?.email;
    const travelerEmail = travelerAuth?.user?.email;

    // Generate action tokens for confirm + decline for each party
    const sendTokens = senderEmail ? await Promise.all([
      createActionToken(supabase, senderEmail,   'confirm_match', matchId, { role: 'sender' }),
      createActionToken(supabase, senderEmail,   'decline_match', matchId, { role: 'sender' }),
    ]) : [null, null];

    const travelTokens = travelerEmail ? await Promise.all([
      createActionToken(supabase, travelerEmail, 'confirm_match', matchId, { role: 'traveler' }),
      createActionToken(supabase, travelerEmail, 'decline_match', matchId, { role: 'traveler' }),
    ]) : [null, null];

    const makeEmail = (
      toEmail: string,
      name: string,
      matchedWith: string,
      confirmToken: string | null,
      declineToken: string | null
    ) => {
      const confirmUrl = confirmToken ? `${appUrl}/confirm?token=${confirmToken}` : `${appUrl}/matches/${matchId}`;
      const declineUrl = declineToken ? `${appUrl}/confirm?token=${declineToken}` : `${appUrl}/matches/${matchId}`;

      return resend.emails.send({
        from: FROM,
        to:   toEmail,
        subject: `BootHop Match Found: ${route}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;color:#f8fafc;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:32px 40px;text-align:center;border-bottom:2px solid #1e40af;">
              <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                ✈️ Boot<span style="color:#38bdf8;">Hop</span>
              </div>
              <div style="color:#7dd3fc;font-size:12px;margin-top:4px;letter-spacing:1.5px;text-transform:uppercase;">Match Found</div>
            </div>

            <div style="padding:32px 40px;">
              <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">Hi ${name},</p>
              <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 24px;">You've been matched with <span style="color:#38bdf8;">${matchedWith}</span></h2>

              <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                  <span style="color:#64748b;font-size:13px;">Route</span>
                  <span style="color:#f1f5f9;font-weight:700;">${route}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                  <span style="color:#64748b;font-size:13px;">Date</span>
                  <span style="color:#f1f5f9;font-weight:600;">${date}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#64748b;font-size:13px;">Agreed price</span>
                  <span style="color:#38bdf8;font-weight:700;">${price}</span>
                </div>
              </div>

              <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Click below to confirm or decline this match. Your response is securely linked to your account — no password needed.</p>

              <div style="display:flex;gap:12px;margin-bottom:32px;">
                <a href="${confirmUrl}" style="flex:1;display:block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;font-size:15px;text-align:center;">
                  ✅ Confirm Match
                </a>
                <a href="${declineUrl}" style="flex:1;display:block;background:#1e293b;border:1px solid #334155;color:#94a3b8;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;">
                  ✗ Decline
                </a>
              </div>

              <p style="color:#475569;font-size:12px;margin:0;">These links expire in 72 hours. If you didn't expect this email, ignore it — no action needed.</p>
            </div>

            <div style="background:#0f172a;border-top:1px solid #1e293b;padding:20px 40px;text-align:center;">
              <p style="color:#334155;font-size:12px;margin:0;">© BootHop · <a href="${appUrl}" style="color:#38bdf8;text-decoration:none;">boothop.com</a></p>
            </div>
          </div>
        `,
        text: `BootHop Match Found: ${route} on ${date} for ${price}.\n\nConfirm: ${confirmUrl}\nDecline: ${declineUrl}`,
      });
    };

    const results = await Promise.allSettled([
      senderEmail   && makeEmail(senderEmail,   'there', 'your matched traveller', sendTokens[0],   sendTokens[1]),
      travelerEmail && makeEmail(travelerEmail, 'there', 'your matched sender',    travelTokens[0], travelTokens[1]),
    ]);

    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length) console.error('Some match emails failed:', errors);

    return NextResponse.json({ success: true, route });

  } catch (error) {
    console.error('Match email error:', error);
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
  }
}
