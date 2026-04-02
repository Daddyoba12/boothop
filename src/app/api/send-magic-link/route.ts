import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'BootHop <noreply@boothop.co.uk>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop.co.uk';

export async function POST(req: NextRequest) {
  try {
    const { email, tripData } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Generate a magic link via Supabase Admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });

    if (error || !data?.properties?.action_link) {
      console.error('Magic link generation failed:', error);
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 });
    }

    const magicLink = data.properties.action_link;

    // Trip summary lines
    const modeLabel = tripData?.mode === 'travel' ? '✈️ Travelling' : '📦 Sending';
    const tripSummary = tripData
      ? `
        <div style="background:#0d2b3e;border-radius:12px;padding:20px 24px;margin:24px 0;border-left:4px solid #00b4d8;">
          <div style="color:#00b4d8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">${modeLabel}</div>
          <div style="color:#ffffff;font-size:18px;font-weight:800;margin-bottom:6px;">${tripData.from} → ${tripData.to}</div>
          <div style="color:#7dd3e8;font-size:14px;">
            📅 ${new Date(tripData.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            ${tripData.weight ? ` · 📦 ${tripData.weight}` : ''}
            ${tripData.price ? ` · 💰 ${tripData.price}` : ''}
          </div>
        </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Confirm your BootHop trip</title>
</head>
<body style="margin:0;padding:0;background:#0f1923;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#0d3b4f 0%,#0a2535 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border-bottom:3px solid #00b4d8;">
          <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            ✈️ Boot<span style="color:#00b4d8;">Hop</span>
          </div>
          <div style="color:#7dd3e8;font-size:12px;margin-top:6px;letter-spacing:1.5px;text-transform:uppercase;">Send Packages Globally · Instantly Matched</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#132030;padding:40px;border-radius:0 0 16px 16px;">

          <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;">You're one tap away 🚀</h2>
          <p style="color:#7dd3e8;font-size:15px;margin:0 0 4px;">Hi there,</p>
          <p style="color:#a8c5d6;font-size:15px;line-height:1.7;margin:0 0 20px;">
            We've received your trip registration on <strong style="color:#ffffff;">BootHop</strong>.
            Click the button below to verify your email and go live — your listing will be posted automatically the moment you confirm.
          </p>

          ${tripSummary}

          <!-- CTA BUTTON -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${magicLink}"
                style="display:inline-block;background:linear-gradient(135deg,#0077a8 0%,#00b4d8 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:18px 48px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(0,180,216,0.35);">
                ✅ Confirm &amp; Post My Trip
              </a>
            </td></tr>
          </table>

          <p style="color:#4a7a99;font-size:13px;text-align:center;margin:0 0 24px;">
            This link expires in 24 hours and can only be used once.
          </p>

          <!-- WHAT HAPPENS NEXT -->
          <div style="background:#0d2b3e;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <div style="color:#00b4d8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">What happens next</div>
            ${[
              ['🔍', 'We instantly scan for matching trips in our network'],
              ['📧', "You'll be notified the moment a match is found"],
              ['🤝', 'Connect with your match, agree terms, and get moving'],
              ['💰', 'Payment held securely in escrow until delivery confirmed'],
            ].map(([icon, text]) => `
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <span style="font-size:18px;flex-shrink:0;">${icon}</span>
                <span style="color:#a8c5d6;font-size:14px;line-height:1.5;">${text}</span>
              </div>`).join('')}
          </div>

          <p style="color:#4a7a99;font-size:12px;text-align:center;line-height:1.7;margin:0;">
            If you didn't request this, you can safely ignore this email.<br/>
            Questions? <a href="mailto:support@boothop.co.uk" style="color:#00b4d8;text-decoration:none;">support@boothop.co.uk</a>
          </p>

          <!-- FOOTER -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #1e3448;padding-top:20px;">
            <tr><td style="text-align:center;color:#4a7a99;font-size:12px;line-height:1.8;">
              <div>© ${new Date().getFullYear()} BootHop Ltd. All rights reserved.</div>
              <div style="margin-top:4px;">
                <a href="${APP_URL}" style="color:#00b4d8;text-decoration:none;">boothop.co.uk</a> ·
                <a href="${APP_URL}/privacy" style="color:#00b4d8;text-decoration:none;">Privacy</a> ·
                <a href="${APP_URL}/terms" style="color:#00b4d8;text-decoration:none;">Terms</a>
              </div>
            </td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '✈️ Confirm your BootHop trip',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('send-magic-link error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
