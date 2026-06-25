import { NextRequest, NextResponse } from 'next/server';
import { sendResendEmail } from '@/lib/resend-client';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    businessName, businessType, location, website,
    description, brandTone, contentThemes,
    email, whatsapp, telegram, postsPerDay,
  } = body;

  if (!businessName || !email) {
    return NextResponse.json({ error: 'Business name and email are required.' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'daddyoba12@gmail.com';

  await sendResendEmail({
    from: 'BootHop Pipeline <noreply@boothop.com>',
    to: adminEmail,
    subject: `🆕 Pipeline Onboarding — ${businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#3b82f6;">Boot</span><span style="font-size:22px;font-weight:900;color:#60a5fa;">Hop Pipeline</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;">New Client Onboarding Request</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Submitted via boothop.com/pipeline/onboard</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px 14px;font-weight:600;color:#475569;width:40%;">Business Name</td>
            <td style="padding:10px 14px;font-weight:700;color:#0f172a;">${businessName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Business Type</td>
            <td style="padding:10px 14px;">${businessType || '—'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Location</td>
            <td style="padding:10px 14px;">${location || '—'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Website / Social</td>
            <td style="padding:10px 14px;">${website || '—'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Posts Per Day</td>
            <td style="padding:10px 14px;">${postsPerDay || '—'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Contact Email</td>
            <td style="padding:10px 14px;">${email}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:10px 14px;font-weight:600;color:#475569;">WhatsApp</td>
            <td style="padding:10px 14px;">${whatsapp || '—'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#475569;">Telegram</td>
            <td style="padding:10px 14px;">${telegram || '—'}</td>
          </tr>
        </table>

        ${description ? `
        <div style="margin-top:24px;">
          <p style="font-weight:600;color:#475569;font-size:14px;margin:0 0 6px;">About the Business</p>
          <p style="background:#f8fafc;padding:14px;border-radius:8px;font-size:14px;color:#334155;margin:0;">${description}</p>
        </div>` : ''}

        ${brandTone ? `
        <div style="margin-top:16px;">
          <p style="font-weight:600;color:#475569;font-size:14px;margin:0 0 6px;">Brand Voice / Tone</p>
          <p style="background:#f8fafc;padding:14px;border-radius:8px;font-size:14px;color:#334155;margin:0;">${brandTone}</p>
        </div>` : ''}

        ${contentThemes ? `
        <div style="margin-top:16px;">
          <p style="font-weight:600;color:#475569;font-size:14px;margin:0 0 6px;">Content Themes / Notes</p>
          <p style="background:#f8fafc;padding:14px;border-radius:8px;font-size:14px;color:#334155;margin:0;">${contentThemes}</p>
        </div>` : ''}

        <p style="margin-top:32px;font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
          BootHop Pipeline · boothop.com
        </p>
      </div>
    `,
  });

  // Confirmation email to the client
  await sendResendEmail({
    from: 'BootHop Pipeline <noreply@boothop.com>',
    to: email,
    subject: `We've received your request — ${businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#3b82f6;">Boot</span><span style="font-size:22px;font-weight:900;color:#60a5fa;">Hop Pipeline</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">We've got your request ✅</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Hi there — thanks for reaching out about the BootHop content pipeline for <strong>${businessName}</strong>.
        </p>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          We've received all your details and will be in touch within 24 hours to get you set up.
        </p>
        <p style="font-size:14px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Questions? Reply to this email or message us on WhatsApp.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
