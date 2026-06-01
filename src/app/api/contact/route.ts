import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  '10minutemail.com', 'throwaway.email', 'maildrop.cc',
  'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'spam4.me',
]);

const SPAM_KEYWORDS = ['click here', 'buy now', 'limited offer', 'act now', 'viagra', 'cialis'];

function calculateGibberish(text: string): number {
  const clean = text.replace(/[^A-Za-z]/g, '');
  if (clean.length < 5) return 0;
  const vowels = (clean.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowels / clean.length;
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return 90;
  if (vowelRatio < 0.15 || vowelRatio > 0.65) return 80;
  if (vowelRatio < 0.25 || vowelRatio > 0.55) return 50;
  return 20;
}

function calculateSpamScore(name: string, email: string, message: string): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  // Name checks
  if (!/^[A-Za-z ]{2,50}$/.test(name)) { score += 25; flags.push('Invalid name format'); }
  const nameGibberish = calculateGibberish(name);
  if (nameGibberish > 70) { score += 30; flags.push(`Gibberish name (${nameGibberish}%)`); }

  // Email checks
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
  if (DISPOSABLE_DOMAINS.has(emailDomain)) { score += 40; flags.push('Disposable email domain'); }
  const emailPrefix = email.split('@')[0];
  if (/\d$/.test(emailPrefix) && emailPrefix.length > 8) { score += 15; flags.push('Suspicious email pattern'); }

  // Message checks
  if (message.length < 20) { score += 20; flags.push('Message too short'); }
  const messageGibberish = calculateGibberish(message);
  if (messageGibberish > 60) { score += 35; flags.push(`Gibberish message (${messageGibberish}%)`); }
  if (message.length > 15 && !message.includes(' ')) { score += 25; flags.push('No spaces in message'); }
  if (SPAM_KEYWORDS.some(kw => message.toLowerCase().includes(kw))) { score += 30; flags.push('Spam keywords detected'); }
  if (message === message.toUpperCase() && message.length > 10) { score += 15; flags.push('All caps message'); }

  return { score: Math.min(score, 100), flags };
}

function getStatus(score: number): 'APPROVED' | 'REVIEW' | 'REJECTED' {
  if (score >= 60) return 'REJECTED';
  if (score >= 30) return 'REVIEW';
  return 'APPROVED';
}

function generateSubject(status: string, spamScore: number, topic: string): string {
  const emoji = { REJECTED: '🚨', REVIEW: '⚠️', APPROVED: '✅' } as Record<string, string>;
  const label = { REJECTED: 'HIGH RISK', REVIEW: 'NEEDS REVIEW', APPROVED: 'VERIFIED' } as Record<string, string>;
  return `${emoji[status]} BootHop Contact | ${label[status]} | ${topic} (Score: ${spamScore})`;
}

export async function POST(request: Request) {
  try {
    const { name, email, topic, message } = await request.json();

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { score: spamScore, flags } = calculateSpamScore(name, email, message);
    const status = getStatus(spamScore);

    if (status === 'REJECTED') {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'BootHop Support <noreply@boothop.com>',
        to: [email],
        subject: 'BootHop Contact Form – Submission Failed',
        text: `Your submission could not be processed due to security validation failures.\nIf you believe this is an error, please contact support@boothop.com directly.`,
      });
      return NextResponse.json({ ok: true, pending: 'verify' });
    }

    const supabase = createSupabaseAdminClient();
    const expires_at = new Date(Date.now() + 24 * 3_600_000).toISOString();

    const { data } = await supabase
      .from('action_tokens')
      .insert({
        email,
        action_type: 'verify_contact',
        entity_id: crypto.randomUUID(),
        payload: { name, email, topic, message, spamScore, flags, status },
        expires_at,
      })
      .select('token')
      .single();

    if (!data?.token) {
      return NextResponse.json({ error: 'Failed to create verification token' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    const verifyLink = `${appUrl}/api/contact/verify?token=${data.token}`;
    const scoreClass = spamScore >= 60 ? 'high' : spamScore >= 30 ? 'medium' : 'low';
    const riskClass = status === 'REVIEW' ? 'review' : 'approved';
    const riskIcon = status === 'REVIEW' ? '⚠️' : '✅';
    const flagsHtml = flags.length
      ? flags.map(f => `<span style="color:#d32f2f;font-weight:bold;">⚠ ${f}</span>`).join('<br>')
      : '✅ All checks passed';

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'BootHop Support <noreply@boothop.com>',
      to: [email],
      subject: 'Confirm your message to BootHop',
      text: [
        `Hi ${name},`,
        '',
        'Thanks for getting in touch! Please confirm your email address by clicking the link below.',
        'Your message will be delivered to our support team once verified.',
        '',
        `Verify: ${verifyLink}`,
        '',
        'This link expires in 24 hours.',
        '',
        '— The BootHop Team',
      ].join('\n'),
    });

    if (process.env.ADMIN_EMAIL) {
      const headerBg = status === 'REVIEW' ? '#f57c00' : '#388e3c';
      await resend.emails.send({
        from: 'BootHop Contact <noreply@boothop.com>',
        to: [process.env.ADMIN_EMAIL],
        subject: generateSubject(status, spamScore, topic),
        html: `<!DOCTYPE html><html><head><style>
          body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;padding:20px}
          .container{max-width:700px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
          .header{padding:20px;color:white;font-weight:bold;font-size:18px;background:${headerBg}}
          .content{padding:25px}
          .field{margin-bottom:15px}
          .label{font-weight:600;color:#555;font-size:12px;text-transform:uppercase;margin-bottom:4px}
          .value{color:#222;font-size:15px;line-height:1.6}
          .metadata{background:#f9f9f9;padding:15px;border-left:4px solid #ddd;margin-top:20px}
          .score{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold}
          .score.high{background:#ffcdd2;color:#c62828}
          .score.medium{background:#ffe0b2;color:#e65100}
          .score.low{background:#c8e6c9;color:#2e7d32}
        </style></head><body>
          <div class="container">
            <div class="header">${riskIcon} BootHop Contact Form | ${status}</div>
            <div class="content">
              <div class="field"><div class="label">Name</div><div class="value">${name}</div></div>
              <div class="field"><div class="label">Email</div><div class="value">${email}</div></div>
              <div class="field"><div class="label">Topic</div><div class="value">${topic}</div></div>
              <div class="field"><div class="label">Message</div><div class="value">${message}</div></div>
              <div class="metadata">
                <div class="field">
                  <div class="label">Spam Score</div>
                  <div class="value"><span class="score ${scoreClass}">${spamScore}/100</span></div>
                </div>
                <div class="field">
                  <div class="label">Validation Flags</div>
                  <div class="value">${flagsHtml}</div>
                </div>
                <div class="field">
                  <div class="label">Verify Link</div>
                  <div class="value"><a href="${verifyLink}">${verifyLink}</a></div>
                </div>
              </div>
            </div>
          </div>
        </body></html>`,
        text: `${riskIcon} BootHop Contact | ${status}\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\nMessage: ${message}\n\nSpam Score: ${spamScore}/100\nFlags: ${flags.join(', ') || 'None'}\n\nVerify: ${verifyLink}`,
      });
    }

    return NextResponse.json({ ok: true, pending: 'verify' });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
