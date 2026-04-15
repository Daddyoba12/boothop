import { Resend } from 'resend';

const from       = process.env.AUTH_FROM_EMAIL  || 'BootHop <noreply@boothop.com>';
const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const supportEmail = process.env.SUPPORT_EMAIL  || 'support@boothop.com';
const whatsappNo   = process.env.WHATSAPP_NUMBER || '';

export async function sendFollowUpUnmatchedEmail(params: {
  toEmail:    string;
  fromCity:   string;
  toCity:     string;
  travelDate: string;   // YYYY-MM-DD
  type:       'send' | 'travel';
}) {
  const resend       = new Resend(process.env.RESEND_API_KEY);
  const dateLabel    = new Date(params.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const role         = params.type === 'travel' ? 'traveller' : 'sender';
  const whatsappUrl  = whatsappNo ? `https://wa.me/${whatsappNo}` : null;
  const registerUrl  = `${appUrl}/register`;
  const journeysUrl  = `${appUrl}/journeys`;

  await resend.emails.send({
    from,
    to: params.toEmail,
    subject: `No match yet for ${params.fromCity} → ${params.toCity} — here's what to do next`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">

        <!-- Logo -->
        <div style="margin-bottom:28px;">
          <span style="font-size:24px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:24px;font-weight:900;color:#2563eb;">Hop</span>
        </div>

        <!-- Heading -->
        <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">
          📦 Update on your trip listing
        </h2>
        <p style="font-size:15px;color:#475569;margin:0 0 24px;">
          Hi there — your BootHop trip date has passed and we weren't able to find a match in time. Here's what happened and what you can do next.
        </p>

        <!-- Route summary box -->
        <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 6px;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Your listing</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#1d4ed8;">
            ${params.fromCity} → ${params.toCity}
          </p>
          <p style="margin:0;font-size:14px;color:#64748b;">
            ${dateLabel} &nbsp;·&nbsp; ${params.type === 'travel' ? 'Travelling (Booter)' : 'Sending (Hooper)'}
          </p>
        </div>

        <!-- Body copy -->
        <p style="font-size:15px;color:#475569;margin:0 0 8px;">
          <strong style="color:#0f172a;">Unfortunately, we didn't find a matching ${params.type === 'travel' ? 'sender' : 'traveller'} in time.</strong>
        </p>
        <p style="font-size:14px;color:#475569;margin:0 0 28px;">
          Don't worry — this route may have more activity soon. Popular routes on BootHop match within 48 hours. You can post a new listing at any time and we'll keep looking for you.
        </p>

        <!-- Next steps box -->
        <div style="background:#f8fafc;border-radius:16px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 14px;font-size:13px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.07em;">🎯 What you can do now</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background:#dbeafe;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#1d4ed8;margin-right:12px;">1</span>
              </td>
              <td style="padding:8px 0;font-size:14px;color:#334155;vertical-align:top;">
                <strong>Post a new trip</strong> — list the same route with a new date and we'll try to match you again straight away.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background:#dcfce7;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#16a34a;margin-right:12px;">2</span>
              </td>
              <td style="padding:8px 0;font-size:14px;color:#334155;vertical-align:top;">
                <strong>Browse live journeys</strong> — check if a traveller on a nearby date is already listed and reach out directly.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <span style="display:inline-block;width:24px;height:24px;background:#fef3c7;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#d97706;margin-right:12px;">3</span>
              </td>
              <td style="padding:8px 0;font-size:14px;color:#334155;vertical-align:top;">
                <strong>Contact us directly</strong> — our team can help match you manually or suggest alternatives on this route.
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA buttons -->
        <table style="border-collapse:collapse;margin:0 0 28px;">
          <tr>
            <td style="padding-right:12px;">
              <a href="${registerUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;">
                Post a new trip →
              </a>
            </td>
            <td>
              <a href="${journeysUrl}" style="display:inline-block;background:#f1f5f9;color:#1e3a8a;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;border:2px solid #bfdbfe;">
                Browse journeys
              </a>
            </td>
          </tr>
        </table>

        <!-- Support section -->
        <div style="background:#f8fafc;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.06em;">Need help? Reach us directly</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;">
            📧 <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;font-weight:600;">${supportEmail}</a>
          </p>
          ${whatsappUrl ? `
          <p style="margin:0;font-size:14px;color:#334155;">
            💬 <a href="${whatsappUrl}" style="color:#16a34a;text-decoration:none;font-weight:600;">WhatsApp us</a>
          </p>
          ` : ''}
        </div>

        <p style="font-size:14px;color:#475569;margin:0 0 24px;">
          We look forward to helping you on your next trip. The BootHop community is growing and new travellers are listing every day.
        </p>

        <p style="font-size:14px;color:#64748b;margin:0;">
          Best regards,<br>
          <strong style="color:#0f172a;">The BootHop Team</strong>
        </p>

        <!-- Footer -->
        <div style="border-top:1px solid #f1f5f9;margin-top:28px;padding-top:16px;">
          <p style="font-size:11px;color:#94a3b8;margin:0;">
            You're receiving this because you listed a trip on BootHop as a ${role}.<br>
            <a href="${appUrl}" style="color:#94a3b8;">boothop.com</a>
          </p>
        </div>

      </div>
    `,
    text: `Hi — your BootHop trip ${params.fromCity} → ${params.toCity} on ${dateLabel} didn't get matched in time.\n\nPost a new trip: ${registerUrl}\nBrowse journeys: ${journeysUrl}\n\nNeed help? Email ${supportEmail}${whatsappUrl ? ` or WhatsApp ${whatsappUrl}` : ''}.\n\nThe BootHop Team`,
  });
}
