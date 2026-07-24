import { sendResendEmail } from '@/lib/resend-client';

interface DeliveryPinParams {
  toEmail:    string;
  pin:        string;
  fromCity:   string;
  toCity:     string;
  matchId:    string;
  sealNumber: string;
}

export async function sendDeliveryPinEmail(p: DeliveryPinParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return sendResendEmail({
    from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
    to:      p.toEmail,
    subject: `Your delivery PIN — ${p.fromCity} → ${p.toCity} | ${p.sealNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span>
          <span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Your delivery PIN is ready</h2>
        <p style="color:#475569;margin:0 0 24px;">Your ${p.fromCity} → ${p.toCity} package is on its way. Share the PIN below with the person receiving it — they will read it to the carrier at the door to confirm delivery.</p>
        <div style="background:#eff6ff;border:2px solid #2563eb;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:#1e40af;letter-spacing:.08em;">Delivery PIN</p>
          <p style="margin:0;font-size:48px;font-weight:900;color:#1e3a8a;letter-spacing:.2em;">${p.pin}</p>
        </div>
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#92400e;">⚠️ Keep this code private</p>
          <p style="margin:4px 0 0;font-size:13px;color:#78350f;">Share it only with the person receiving your package — not with the carrier. The carrier will ask the receiver to read it out at delivery.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0;color:#64748b;width:130px;">Route</td>
            <td style="padding:8px 0;font-weight:600;">${p.fromCity} → ${p.toCity}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;">Seal number</td>
            <td style="padding:8px 0;font-weight:600;">${p.sealNumber}</td>
          </tr>
        </table>
        <a href="${appUrl}/matches/${p.matchId}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">View match →</a>
      </div>
    `,
    text: `Your BootHop delivery PIN for ${p.fromCity} → ${p.toCity} is: ${p.pin}\n\nSeal: ${p.sealNumber}\n\nShare this PIN with the person receiving your package — NOT with the carrier. The carrier will ask for it at delivery.\n\nView match: ${appUrl}/matches/${p.matchId}`,
  });
}
