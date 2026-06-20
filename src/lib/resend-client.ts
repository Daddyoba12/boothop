import { Resend } from 'resend';

const client = new Resend(process.env.RESEND_API_KEY);

const DEV_DISABLED = process.env.DISABLE_EMAILS === 'true';

export async function sendResendEmail(params: {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}) {
  if (DEV_DISABLED) {
    console.log(`[email suppressed] to=${JSON.stringify(params.to)} subject="${params.subject}"`);
    return { data: { id: 'dev-suppressed' }, error: null };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.emails.send(params as any);
}
