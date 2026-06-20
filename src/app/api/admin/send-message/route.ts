import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdminApi } from '@/lib/auth/admin';

const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const logoUrl = `${appUrl}/images/boothop-logo.png`;

function buildHtml(body: string): string {
  const paragraphs = body
    .split('\n')
    .map(line => line.trim())
    .map(line =>
      line === ''
        ? ''
        : line.startsWith('•')
        ? `<li style="margin:4px 0;color:#334155;">${line.slice(1).trim()}</li>`
        : `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${line}</p>`
    );

  // wrap consecutive <li> into <ul>
  const html = paragraphs.join('\n').replace(/(<li[^>]*>.*?<\/li>\n?)+/g, m =>
    `<ul style="margin:0 0 14px;padding-left:20px;">${m}</ul>`
  );

  return `
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
            <img src="${logoUrl}" alt="BootHop" height="48" style="height:48px;display:inline-block;" onerror="this.style.display='none'" />
            <div style="margin-top:8px;">
              <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Boot</span><span style="font-size:28px;font-weight:900;color:#93c5fd;letter-spacing:-0.5px;">Hop</span>
            </div>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Connecting senders &amp; travellers worldwide</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            ${html}
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
              Go to my Dashboard &rarr;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You are receiving this email because you have an account with BootHop.<br/>
              &copy; ${new Date().getFullYear()} BootHop &bull; <a href="${appUrl}" style="color:#2563eb;text-decoration:none;">www.boothop.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { emails, subject, body } = await request.json();

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 });
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Subject and body required' }, { status: 400 });
  }

  // Deduplicate
  const unique = Array.from(new Set(emails.map((e: string) => e.toLowerCase().trim()).filter(Boolean)));

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
  const html   = buildHtml(body);
  const text   = body;

  let sent = 0;
  let failed = 0;

  // Send in batches of 50 to stay within rate limits
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const results = await Promise.allSettled(
      batch.map(to => resend.emails.send({ from, to, subject, html, text }))
    );
    for (const r of results) {
      r.status === 'fulfilled' ? sent++ : failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
