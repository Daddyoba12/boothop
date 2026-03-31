import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boothop-one.vercel.app';

export async function POST(request: Request) {
  try {
    const { email, from, to } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1923;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#0d3b4f 0%,#0a2535 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:3px solid #00b4d8;">
          <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            ✈️ Boot<span style="color:#00b4d8;">Hop</span>
          </div>
          <div style="color:#7dd3e8;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Send Packages Globally · Instantly Matched</div>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#132030;padding:40px;border-radius:0 0 16px 16px;">

          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:48px;margin-bottom:12px;">🔗</div>
            <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;">Almost there!</h1>
            <p style="color:#7dd3e8;font-size:15px;margin:0;">Check your inbox for the magic link</p>
          </div>

          <p style="color:#b8d4e3;font-size:15px;line-height:1.7;margin:0 0 16px;">
            We've sent a secure magic link to <strong style="color:#ffffff;">${email}</strong>.
            Click it to verify your account and your trip will be saved automatically.
          </p>

          ${from && to ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2a3d;border-radius:12px;margin:24px 0;border:1px solid #1e3f5a;">
            <tr>
              <td style="padding:10px 16px;color:#7dd3e8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:40%;">📍 From</td>
              <td style="padding:10px 16px;color:#ffffff;font-size:14px;font-weight:500;">${from}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;color:#7dd3e8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">🏁 To</td>
              <td style="padding:10px 16px;color:#ffffff;font-size:14px;font-weight:500;">${to}</td>
            </tr>
          </table>
          ` : ''}

          <div style="background:#0d2a3d;border-radius:12px;padding:16px;margin-top:24px;border-left:4px solid #00b4d8;">
            <p style="color:#7dd3e8;font-size:13px;margin:0;">
              💡 <strong style="color:#ffffff;">Tip:</strong> The magic link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <!-- FOOTER -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #1e3448;padding-top:24px;">
            <tr>
              <td style="text-align:center;color:#4a7a99;font-size:12px;line-height:1.8;">
                <div>© ${new Date().getFullYear()} BootHop Ltd. All rights reserved.</div>
                <div style="margin-top:4px;">
                  <a href="${APP_URL}" style="color:#00b4d8;text-decoration:none;">boothop.com</a> ·
                  <a href="${APP_URL}/privacy" style="color:#00b4d8;text-decoration:none;">Privacy</a> ·
                  <a href="${APP_URL}/terms" style="color:#00b4d8;text-decoration:none;">Terms</a>
                </div>
              </td>
            </tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: 'BootHop <noreply@boothop.com>',
      to: email,
      subject: '🔗 Your BootHop magic link is ready',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
