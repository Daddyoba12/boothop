import { sendResendEmail } from '@/lib/resend-client';

const from   = process.env.AUTH_FROM_EMAIL     || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

// ── Seal pending: sent to both parties when inspection passes ─────────────────
export async function sendSealPendingEmail(params: {
  toEmail:   string;
  role:      'sender' | 'traveler';
  fromCity:  string;
  toCity:    string;
  matchId:   string;
}) {
  const { toEmail, role, fromCity, toCity, matchId } = params;
  const matchUrl = `${appUrl}/matches/${matchId}`;

  const isTraveler = role === 'traveler';

  await sendResendEmail({
    from, to: toEmail,
    subject: `Inspection passed — SecureSeal required | ${fromCity} → ${toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Inspection passed — one step remaining</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The handover inspection for <strong>${fromCity} → ${toCity}</strong> has been completed successfully.
          ${isTraveler
            ? 'Please generate and apply the BootHop SecureSeal to the package to complete activation and release contact details.'
            : 'The carrier will now apply the BootHop SecureSeal to your package. Contact details will be released once the seal is activated.'}
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#166534;font-weight:600;">
            ${isTraveler
              ? '📋 Next step: Open the match, generate the SecureSeal, print the label, apply it to the package, and activate it.'
              : '⏳ Waiting for the carrier to apply the SecureSeal. You will receive a confirmation when it is activated.'}
          </p>
        </div>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View match →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${matchId}
        </p>
      </div>
    `,
    text: isTraveler
      ? `Inspection passed for ${fromCity} → ${toCity}. Generate the SecureSeal and apply it to the package to complete activation.\n\n${matchUrl}`
      : `Inspection passed for ${fromCity} → ${toCity}. Waiting for the carrier to apply the SecureSeal.\n\n${matchUrl}`,
  });
}

// ── Seal activated: sent to both parties when seal is activated ───────────────
export async function sendSealActivatedEmail(params: {
  toEmail:    string;
  role:       'sender' | 'traveler';
  fromCity:   string;
  toCity:     string;
  matchId:    string;
  sealNumber: string;
  otherEmail: string;
}) {
  const { toEmail, role, fromCity, toCity, matchId, sealNumber, otherEmail } = params;
  const matchUrl = `${appUrl}/matches/${matchId}`;

  await sendResendEmail({
    from, to: toEmail,
    subject: `SecureSeal activated — shipment live | ${fromCity} → ${toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔒 SecureSeal activated — shipment is live</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 16px;">
          The BootHop SecureSeal for your <strong>${fromCity} → ${toCity}</strong> shipment has been activated.
          Contact details are now released.
        </p>
        <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
          <p style="margin:0 0 6px;font-size:12px;color:#166534;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Seal Number</p>
          <p style="margin:0;font-size:20px;font-weight:800;font-family:monospace;color:#14532d;letter-spacing:0.1em;">${sealNumber}</p>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;">
            ${role === 'sender' ? 'Carrier (Booter)' : 'Sender (Hooper)'}
          </p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${otherEmail}</p>
        </div>
        <a href="${matchUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View match →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${matchId} · Seal: ${sealNumber}
        </p>
      </div>
    `,
    text: `SecureSeal ${sealNumber} activated for ${fromCity} → ${toCity}. Contact details released.\n\n${role === 'sender' ? 'Carrier' : 'Sender'}: ${otherEmail}\n\n${matchUrl}`,
  });
}

// ── Sender confirmation request: non-blocking, sent after traveller activates ─
export async function sendSealConfirmationRequestEmail(params: {
  toEmail:    string;
  fromCity:   string;
  toCity:     string;
  matchId:    string;
  sealNumber: string;
}) {
  const { toEmail, fromCity, toCity, matchId, sealNumber } = params;
  const confirmUrl = `${appUrl}/matches/${matchId}`;

  await sendResendEmail({
    from, to: toEmail,
    subject: `Please confirm the seal was applied | ${fromCity} → ${toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔒 Confirm the SecureSeal was applied</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The carrier has activated SecureSeal <strong>${sealNumber}</strong> for your <strong>${fromCity} → ${toCity}</strong> package.
          Please confirm you observed the seal being applied correctly.
        </p>
        <p style="font-size:13px;color:#64748b;margin:0 0 24px;">
          If the seal was <strong>not</strong> applied in your presence, or if anything looked wrong, please open a dispute immediately from your match page rather than confirming.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Confirm on match page →
        </a>
      </div>
    `,
    text: `Confirm SecureSeal ${sealNumber} was applied for ${fromCity} → ${toCity}.\n\nIf the seal was not applied in your presence, open a dispute instead.\n\n${confirmUrl}`,
  });
}
