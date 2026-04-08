import { Resend } from 'resend';

const from   = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

function header() {
  return `<div style="margin-bottom:24px;">
    <span style="font-size:22px;font-weight:900;color:#059669;">Boot</span><span style="font-size:22px;font-weight:900;color:#10b981;">Hop Business</span>
  </div>`;
}

function footer(extra = '') {
  return `<p style="font-size:13px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin:24px 0 0;">
    ${extra}Questions? Reply to this email or contact <a href="mailto:support@boothop.com" style="color:#059669;">support@boothop.com</a>
  </p>`;
}

export async function sendBusinessOtpEmail(params: { to: string; code: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `${params.code} — BootHop Business verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Your verification code</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 24px;">Enter this code to access the BootHop Business portal. Expires in 10 minutes.</p>
        <div style="font-size:44px;font-weight:900;letter-spacing:8px;padding:20px 28px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:16px;display:inline-block;margin:0 0 24px;color:#065f46;font-family:monospace;">${params.code}</div>
        ${footer('Only business email addresses are permitted on this portal. Do not share this code. ')}
      </div>
    `,
    text: `Your BootHop Business verification code is: ${params.code}\n\nExpires in 10 minutes.`,
  });
}

export async function sendBusinessJobConfirmationEmail(params: {
  to: string; jobRef: string; pickup: string; dropoff: string; urgency: string; price: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const urgencyLabel = params.urgency === 'same_day' ? 'Same Day' : 'Next Morning';
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Delivery request confirmed — Ref: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Request received</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your delivery request has been submitted. Our team will assign a carrier shortly.
        </p>
        <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Job Reference</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#059669;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#475569;">📍 <strong>${params.pickup}</strong> → <strong>${params.dropoff}</strong></p>
          <p style="margin:0 0 6px;font-size:14px;color:#475569;">⚡ ${urgencyLabel}</p>
          <p style="margin:0;font-size:14px;color:#059669;font-weight:700;">Estimated: £${params.price}</p>
        </div>
        <p style="font-size:14px;color:#475569;background:#fefce8;border:1px solid #fef08a;border-radius:12px;padding:12px 16px;margin:0 0 16px;">
          💳 <strong>Payment:</strong> Our team will send you a payment link or bank transfer details to confirm your booking. No payment is taken automatically.
        </p>
        ${footer('Keep this reference number for your records. ')}
      </div>
    `,
    text: `BootHop Business — Job Ref: ${params.jobRef}\n\n${params.pickup} → ${params.dropoff}\n${urgencyLabel}\nEstimated: £${params.price}\n\nOur team will contact you with payment details and carrier assignment.`,
  });
}

export async function sendBusinessJobAdminAlertEmail(params: {
  jobRef: string; email: string; companyName?: string; pickup: string; dropoff: string;
  description: string; weight: string; declaredValue: string; category: string;
  urgency: string; insurance: boolean; price: number;
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
        ${header()}
        <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;">New Job</span>
        <h2 style="margin:16px 0 20px;font-size:20px;font-weight:700;">New business delivery request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:140px;">Reference</td><td style="padding:8px 0;font-weight:700;color:#059669;font-family:monospace;">${params.jobRef}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Company</td><td style="padding:8px 0;font-weight:600;">${params.companyName || '—'}</td></tr>
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
        <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">Assign a carrier and send the business a payment link at ${params.email}.</p>
      </div>
    `,
    text: `New Business Job: ${params.jobRef}\n\n${params.companyName || ''} (${params.email})\n${params.pickup} → ${params.dropoff}\n${urgencyLabel}\nPrice: £${params.price}`,
  });
}

export async function sendBusinessDriverAssignedEmail(params: {
  to: string; jobRef: string; pickup: string; dropoff: string;
  driverName: string; driverPhone?: string | null; driverEmail?: string | null;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Driver assigned — Ref: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">🚗 Driver assigned to your job</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          A carrier has been assigned to your delivery. They will collect from your pickup location shortly.
        </p>
        <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Job Reference</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:900;color:#059669;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#475569;">📍 ${params.pickup} → ${params.dropoff}</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your carrier</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e3a8a;">${params.driverName}</p>
          ${params.driverPhone ? `<p style="margin:0 0 4px;font-size:14px;color:#1d4ed8;">📞 ${params.driverPhone}</p>` : ''}
          ${params.driverEmail ? `<p style="margin:0;font-size:14px;color:#1d4ed8;">✉️ ${params.driverEmail}</p>` : ''}
        </div>
        ${footer('Please ensure someone is available at the pickup address. ')}
      </div>
    `,
    text: `BootHop Business — Driver Assigned\n\nJob: ${params.jobRef}\nRoute: ${params.pickup} → ${params.dropoff}\nDriver: ${params.driverName}${params.driverPhone ? `\nPhone: ${params.driverPhone}` : ''}`,
  });
}

export async function sendBusinessInTransitEmail(params: {
  to: string; jobRef: string; pickup: string; dropoff: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Your delivery is on the way — Ref: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">📦 Goods collected — delivery in progress</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your carrier has collected the goods from ${params.pickup} and is now in transit to ${params.dropoff}.
        </p>
        <div style="background:#f8fafc;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Job Reference</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#059669;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0;font-size:14px;color:#475569;">🚚 ${params.pickup} → <strong>${params.dropoff}</strong></p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 16px;">Please ensure someone is available at the drop-off address to receive the delivery.</p>
        ${footer()}
      </div>
    `,
    text: `BootHop Business — In Transit\n\nJob: ${params.jobRef}\n${params.pickup} → ${params.dropoff}\n\nYour goods have been collected and are on the way.`,
  });
}

export async function sendBusinessDeliveredEmail(params: {
  to: string; jobRef: string; pickup: string; dropoff: string; price: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Delivery complete — Invoice: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">✅ Delivery complete</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Your goods have been successfully delivered. Thank you for using BootHop Business.
        </p>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Delivery Summary</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:900;color:#059669;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#166534;">📍 ${params.pickup} → ${params.dropoff}</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#059669;">Amount due: £${params.price}</p>
        </div>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:12px;padding:16px;margin:0 0 16px;">
          <p style="margin:0;font-size:14px;color:#713f12;">
            💳 <strong>Payment:</strong> Please arrange payment for £${params.price} via the details provided by our team, or reply to this email to request bank transfer instructions.
          </p>
        </div>
        ${footer('Please retain this email as your proof of delivery. ')}
      </div>
    `,
    text: `BootHop Business — Delivery Complete\n\nJob: ${params.jobRef}\n${params.pickup} → ${params.dropoff}\nAmount due: £${params.price}\n\nPlease contact us to arrange payment.`,
  });
}

export async function sendBusinessFailedEmail(params: {
  to: string; jobRef: string; pickup: string; dropoff: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Delivery issue — Action required: ${params.jobRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        ${header()}
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⚠️ Delivery could not be completed</h2>
        <p style="font-size:15px;color:#475569;margin:0 0 20px;">
          Unfortunately your delivery was unable to be completed. Our team is investigating and will be in touch shortly.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:20px;margin:0 0 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#991b1b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Affected Job</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:900;color:#dc2626;font-family:monospace;">${params.jobRef}</p>
          <p style="margin:0;font-size:14px;color:#7f1d1d;">📍 ${params.pickup} → ${params.dropoff}</p>
        </div>
        <p style="font-size:14px;color:#475569;margin:0 0 16px;">
          No charge will be applied for a failed delivery. We will arrange a re-attempt or full refund. Please reply to this email or contact support.
        </p>
        ${footer()}
      </div>
    `,
    text: `BootHop Business — Delivery Failed\n\nJob: ${params.jobRef}\n${params.pickup} → ${params.dropoff}\n\nYour delivery could not be completed. No charge applied. We will be in touch shortly.`,
  });
}
