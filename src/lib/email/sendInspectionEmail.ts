import { sendResendEmail } from '@/lib/resend-client';

const from       = process.env.AUTH_FROM_EMAIL  || 'BootHop <noreply@boothop.com>';
const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
const adminEmail = process.env.ADMIN_EMAIL      || 'admin@boothop.com';

// ── Traveller: please complete handover inspection ────────────────────────────

export async function sendInspectionRequestEmail(params: {
  toEmail:     string;
  fromCity:    string;
  toCity:      string;
  matchId:     string;
  itemName:    string;
  senderEmail: string;
}) {
  const inspectUrl = `${appUrl}/matches/${params.matchId}/inspection`;
  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Action required: inspect item before handover — ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔍 Please inspect the item before accepting</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          The item declaration for your <strong>${params.fromCity} → ${params.toCity}</strong> delivery has been approved.
          Before contact details are released, please complete the handover inspection checklist.
        </p>
        <div style="background:#fef9c3;border:2px solid #fbbf24;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
            Item: <strong>${params.itemName}</strong> — from ${params.senderEmail}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#92400e;">
            This takes under 2 minutes. Please inspect the item carefully before signing off.
          </p>
        </div>
        <a href="${inspectUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Complete inspection →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${params.matchId}
        </p>
      </div>
    `,
    text: `Action required: inspect the item before handover for ${params.fromCity} → ${params.toCity}.\n\nItem: ${params.itemName}\n\nComplete inspection: ${inspectUrl}`,
  });
}

// ── Sender: inspection in progress, waiting ───────────────────────────────────

export async function sendInspectionWaitEmail(params: {
  toEmail:  string;
  fromCity: string;
  toCity:   string;
  matchId:  string;
}) {
  const matchUrl = `${appUrl}/matches/${params.matchId}`;
  await sendResendEmail({
    from,
    to: params.toEmail,
    subject: `Your declaration was approved — carrier is inspecting the item | ${params.fromCity} → ${params.toCity}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Declaration approved — final check underway</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your item declaration for <strong>${params.fromCity} → ${params.toCity}</strong> has been approved.
          The carrier is completing a brief handover inspection before contact details are released.
          You will receive another email once this is done — usually within a few hours.
        </p>
        <a href="${matchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          View delivery details →
        </a>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
          Match ID: ${params.matchId}
        </p>
      </div>
    `,
    text: `Your declaration for ${params.fromCity} → ${params.toCity} was approved. The carrier is completing their inspection. We will notify you when done.\n\n${matchUrl}`,
  });
}

// ── Admin: inspection failed — manual review needed ───────────────────────────

export async function sendAdminInspectionFailedEmail(params: {
  matchId:         string;
  fromCity:        string;
  toCity:          string;
  inspectorEmail:  string;
  failedChecks:    string[];
  inspectorNote:   string | null;
}) {
  const reviewUrl = `${appUrl}/admin/compliance/${params.matchId}`;
  await sendResendEmail({
    from,
    to: adminEmail,
    subject: `[INSPECTION FAILED] ${params.fromCity} → ${params.toCity} — Match ${params.matchId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Inspection Failed</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#dc2626;">⚠️ Handover inspection failed</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 16px;">The carrier flagged issues during the handover inspection. Shipment has been suspended pending your review.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Inspector</td><td style="padding:10px 14px;">${params.inspectorEmail}</td></tr>
          ${params.failedChecks.length ? `<tr style="background:#fef2f2;"><td style="padding:10px 14px;color:#dc2626;font-weight:700;">Failed checks</td><td style="padding:10px 14px;color:#dc2626;font-weight:600;">${params.failedChecks.join(', ')}</td></tr>` : ''}
          ${params.inspectorNote ? `<tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Inspector note</td><td style="padding:10px 14px;">${params.inspectorNote}</td></tr>` : ''}
        </table>
        <a href="${reviewUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
          Review in admin hub →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin-top:16px;">Match ID: ${params.matchId}</p>
      </div>
    `,
    text: `Inspection failed for ${params.fromCity} → ${params.toCity}.\nInspector: ${params.inspectorEmail}\nFailed: ${params.failedChecks.join(', ')}\nNote: ${params.inspectorNote ?? 'none'}\n\nReview: ${reviewUrl}`,
  });
}

// ── Admin: MANUAL_REVIEW risk alert (email+SMS via caller) ────────────────────

export async function sendAdminRiskAlertEmail(params: {
  matchId:         string;
  fromCity:        string;
  toCity:          string;
  senderEmail:     string;
  itemName:        string;
  itemCategory:    string;
  riskScore:       number;
  classification:  string;
  flags:           string[];
  breakdown:       Record<string, number>;
}) {
  const reviewUrl = `${appUrl}/admin/compliance/${params.matchId}`;
  await sendResendEmail({
    from,
    to: adminEmail,
    subject: `[RISK: MANUAL_REVIEW] ${params.fromCity} → ${params.toCity} — Score ${params.riskScore}/100`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
          <span style="margin-left:12px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Manual Review Required</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🔍 Risk engine flagged this declaration for manual review</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;width:40%;">Route</td><td style="padding:10px 14px;font-weight:700;">${params.fromCity} → ${params.toCity}</td></tr>
          <tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Sender</td><td style="padding:10px 14px;">${params.senderEmail}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-weight:600;">Item</td><td style="padding:10px 14px;">${params.itemName || '—'} (${params.itemCategory || '—'})</td></tr>
          <tr style="background:#fef3c7;"><td style="padding:10px 14px;color:#92400e;font-weight:700;">Risk Score</td><td style="padding:10px 14px;font-weight:900;color:#d97706;">${params.riskScore}/100 — ${params.classification}</td></tr>
          ${params.flags.length ? `<tr style="background:#fef2f2;"><td style="padding:10px 14px;color:#dc2626;font-weight:700;">Flags</td><td style="padding:10px 14px;color:#dc2626;font-weight:600;">${params.flags.join(', ')}</td></tr>` : ''}
          ${Object.keys(params.breakdown).length ? `<tr><td style="padding:10px 14px;color:#64748b;font-weight:600;">Score breakdown</td><td style="padding:10px 14px;font-size:12px;color:#64748b;">${Object.entries(params.breakdown).map(([k,v])=>`${k}: +${v}`).join(' · ')}</td></tr>` : ''}
        </table>
        <div style="background:#fef3c7;border:2px solid #fbbf24;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
            This shipment is waiting for your approval before proceeding to handover inspection.
            Review the full declaration and evidence before deciding.
          </p>
        </div>
        <a href="${reviewUrl}" style="display:inline-block;background:#d97706;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
          Review declaration →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin-top:16px;">Match ID: ${params.matchId} · Use the admin hub to approve for inspection or reject.</p>
      </div>
    `,
    text: `MANUAL_REVIEW risk alert.\nRoute: ${params.fromCity} → ${params.toCity}\nItem: ${params.itemName} (${params.itemCategory})\nRisk: ${params.riskScore}/100\nFlags: ${params.flags.join(', ')}\n\nReview: ${reviewUrl}`,
  });
}
