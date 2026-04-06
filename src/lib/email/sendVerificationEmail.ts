import { Resend } from 'resend';

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `${params.code} is your BootHop verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#1e3a8a;letter-spacing:-0.5px;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Your verification code</h2>
        <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px;">Enter this code on BootHop to continue. It expires in 10 minutes.</p>
        <div style="font-size:44px;font-weight:900;letter-spacing:8px;padding:20px 28px;background:#eff6ff;border:2px solid #bfdbfe;border-radius:16px;display:inline-block;margin:0 0 24px;color:#1d4ed8;font-family:monospace;">${params.code}</div>
        <p style="font-size:13px;line-height:1.6;color:#94a3b8;margin:0;border-top:1px solid #f1f5f9;padding-top:16px;">If you didn't request this, you can safely ignore this email. Do not share this code with anyone.</p>
      </div>
    `,
    text: `Your BootHop verification code is: ${params.code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
