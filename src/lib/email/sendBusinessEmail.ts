import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

export async function sendBusinessOtpEmail(params: {
  to: string;
  code: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `${params.code} — BootHop Business verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Business</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Your verification code</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 24px;">Enter this code to access the BootHop Business portal. Expires in 10 minutes.</p>
        <div style="font-size:44px;font-weight:900;letter-spacing:8px;padding:20px 28px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:16px;display:inline-block;margin:0 0 24px;color:#065f46;font-family:monospace;">${params.code}</div>
        <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:0;">
          Only business email addresses are permitted on this portal. Do not share this code.
        </p>
      </div>
    `,
    text: `Your BootHop Business verification code is: ${params.code}\n\nExpires in 10 minutes.`,
  });
}

export async function sendBusinessJobConfirmationEmail(params: {
  to: string;
  jobRef: string;
  pickup: string;
  dropoff: string;
  urgency: string;
  price: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const urgencyLabel = params.urgency === 'same_day' ? 'Same Day' : 'Next Morning';
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Delivery request confirmed — Ref: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Business</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Request received</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your delivery request has been submitted. Our team will match a carrier and confirm shortly.
        </p>
        <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Job Reference</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#059669;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#475569;">📍 <strong>${params.pickup}</strong> → <strong>${params.dropoff}</strong></p>
          <p style="margin:0 0 6px;font-size:14px;color:#475569;">⚡ ${urgencyLabel}</p>
          <p style="margin:0;font-size:14px;color:#059669;font-weight:700;">Estimated: £${params.price}</p>
        </div>
        <p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:0;">
          Keep this reference number for your records. We will be in touch via email.
        </p>
      </div>
    `,
    text: `BootHop Business — Job Ref: ${params.jobRef}\n\n${params.pickup} → ${params.dropoff}\n${urgencyLabel}\nEstimated: £${params.price}\n\nOur team will be in touch shortly.`,
  });
}

export async function sendBusinessJobAdminAlertEmail(params: {
  jobRef: string;
  email: string;
  pickup: string;
  dropoff: string;
  description: string;
  weight: string;
  declaredValue: string;
  category: string;
  urgency: string;
  insurance: boolean;
  price: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
  const urgencyLabel = params.urgency === 'same_day' ? 'Same Day' : 'Next Morning';
  await resend.emails.send({
    from,
    to: adminEmail,
    subject: `⚡ New Business Job — ${params.jobRef} | ${params.pickup} → ${params.dropoff}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Business</span>
          <span style="margin-left:12px;font-size:11px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New Job</span>
        </div>
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;">New business delivery request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Reference</td><td style="padding:8px 0;font-weight:700;color:#059669;font-family:monospace;">${params.jobRef}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Business email</td><td style="padding:8px 0;font-weight:600;">${params.email}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Pickup</td><td style="padding:8px 0;font-weight:600;">${params.pickup}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Drop-off</td><td style="padding:8px 0;font-weight:600;">${params.dropoff}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Description</td><td style="padding:8px 0;">${params.description || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Weight</td><td style="padding:8px 0;">${params.weight || '—'} kg</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Declared value</td><td style="padding:8px 0;">£${params.declaredValue || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Category</td><td style="padding:8px 0;">${params.category || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Urgency</td><td style="padding:8px 0;font-weight:600;">${urgencyLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Insurance</td><td style="padding:8px 0;">${params.insurance ? '✅ Yes' : '❌ No'}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;border-top:1px solid #f1f5f9;">Estimated price</td><td style="padding:8px 0;font-weight:700;font-size:18px;color:#059669;border-top:1px solid #f1f5f9;">£${params.price}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">Find and assign a carrier, then contact the business at ${params.email} to confirm.</p>
      </div>
    `,
    text: `New Business Job: ${params.jobRef}\n\n${params.email}\n${params.pickup} → ${params.dropoff}\n${urgencyLabel}\nPrice: £${params.price}`,
  });
}
