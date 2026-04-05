import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  verifyUrl: string;
}) {
  const from = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `${params.code} is your BootHop verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="margin:0 0 12px;">Verify your email</h2>
        <p style="font-size:16px;line-height:1.6;">Use this code to continue on BootHop:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:4px;padding:16px 20px;background:#eff6ff;border-radius:14px;display:inline-block;margin:10px 0 18px;">${params.code}</div>
        <p style="font-size:15px;line-height:1.6;">Or tap the button below to verify instantly:</p>
        <p style="margin:24px 0;">
          <a href="${params.verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:600;">Verify email</a>
        </p>
        <p style="font-size:14px;line-height:1.6;color:#475569;">This code expires in 10 minutes and can only be used once.</p>
      </div>
    `,
    text: `Your BootHop verification code is ${params.code}. Or open this link: ${params.verifyUrl}`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
