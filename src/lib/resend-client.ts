import { Resend } from 'resend';

const client = new Resend(process.env.RESEND_API_KEY);

const DEV_DISABLED = process.env.DISABLE_EMAILS === 'true';

// Founders always receive a copy of every outbound email
const FOUNDER_CC = ['omobola.famutimi@outlook.com', 'asheks2000@yahoo.com'];

export async function sendResendEmail(params: {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename: string; content: string | Buffer }>;
}) {
  if (DEV_DISABLED) {
    console.log(`[email suppressed] to=${JSON.stringify(params.to)} subject="${params.subject}"`);
    return { data: { id: 'dev-suppressed' }, error: null };
  }

  const existingCc = params.cc
    ? Array.isArray(params.cc) ? params.cc : [params.cc]
    : [];

  const mergedParams = {
    ...params,
    cc: [...existingCc, ...FOUNDER_CC],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.emails.send(mergedParams as any);

  // The Resend SDK reports failures by returning { data: null, error } — it does not
  // throw. Without this log a rejected send (suppression, rate limit, invalid address)
  // is completely silent, and the .catch() guards around every call site never fire.
  if (result?.error) {
    console.error('[resend] send failed', {
      to:      params.to,
      subject: params.subject,
      error:   result.error,
    });
  }

  return result;
}
