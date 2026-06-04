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

// ── Language / script coherence ───────────────────────────────────────────────

type Script = 'latin' | 'cyrillic' | 'arabic' | 'cjk' | 'devanagari' | 'unknown';

function detectScript(text: string): Script {
  let latin = 0, cyrillic = 0, arabic = 0, cjk = 0, devanagari = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 192 && c <= 591)) latin++;
    else if (c >= 1024 && c <= 1279) cyrillic++;
    else if (c >= 0x0600 && c <= 0x06FF) arabic++;
    else if ((c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3040 && c <= 0x30FF) || (c >= 0xAC00 && c <= 0xD7AF)) cjk++;
    else if (c >= 0x0900 && c <= 0x097F) devanagari++;
  }
  const best = { latin, cyrillic, arabic, cjk, devanagari };
  const top = (Object.entries(best) as [Script, number][]).sort((a, b) => b[1] - a[1])[0];
  return top[1] === 0 ? 'unknown' : top[0];
}

// Countries whose primary written script is NOT Latin
// Latin is always accepted as a universal fallback (English is global)
const COUNTRY_SCRIPTS: Record<string, Script[]> = {
  RU: ['cyrillic'], BY: ['cyrillic'], UA: ['cyrillic'], BG: ['cyrillic'], RS: ['cyrillic'], MK: ['cyrillic'],
  CN: ['cjk'], JP: ['cjk'], KR: ['cjk'], TW: ['cjk'],
  SA: ['arabic'], AE: ['arabic'], EG: ['arabic'], IQ: ['arabic'], JO: ['arabic'], KW: ['arabic'],
  MA: ['arabic'], DZ: ['arabic'], TN: ['arabic'], LY: ['arabic'], YE: ['arabic'], OM: ['arabic'],
  IN: ['latin', 'devanagari'], NP: ['devanagari'],
  IR: ['arabic'], PK: ['arabic'],
};

function checkLinguisticCoherence(text: string, country: string): { score: number; flag?: string } {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return { score: 0 };

  // Abnormally long "words" — likely encoded spam or random strings
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen > 18) return { score: 30, flag: 'Incoherent word structure (avg word too long)' };

  // Very high ratio of unique characters to length — random-string indicator
  const charSet = new Set(text.toLowerCase().replace(/\s/g, ''));
  const entropy = charSet.size / Math.max(text.replace(/\s/g, '').length, 1);
  if (entropy > 0.85 && text.length > 20) return { score: 25, flag: 'High character entropy (likely random)' };

  // Excessive word repetition — bots often repeat the same word/phrase
  const unique = new Set(words.map(w => w.toLowerCase()));
  if (words.length >= 6 && unique.size / words.length < 0.4) {
    return { score: 20, flag: 'Excessive word repetition' };
  }

  // Script vs IP country mismatch
  const script = detectScript(text);
  const expected = COUNTRY_SCRIPTS[country?.toUpperCase() ?? ''];
  if (expected && script !== 'latin' && !expected.includes(script)) {
    return { score: 20, flag: `Script mismatch for IP country ${country} (detected: ${script})` };
  }
  // Inverse: if IP is Cyrillic/CJK/Arabic country but message is pure gibberish unknown script
  if (expected && script === 'unknown') {
    return { score: 20, flag: `Unrecognised script from ${country}` };
  }

  return { score: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────

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

function calculateSpamScore(name: string, email: string, message: string, country = ''): { score: number; flags: string[] } {
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

  // Language / script coherence vs IP country
  const lang = checkLinguisticCoherence(message, country);
  if (lang.score > 0 && lang.flag) { score += lang.score; flags.push(lang.flag); }

  return { score: Math.min(score, 100), flags };
}

function getStatus(score: number): 'APPROVED' | 'REVIEW' | 'REJECTED' {
  if (score >= 60) return 'REJECTED';
  if (score >= 30) return 'REVIEW';
  return 'APPROVED';
}


export async function POST(request: Request) {
  try {
    const { name, email, topic, message, _hp } = await request.json();

    // Honeypot — bots fill hidden fields, humans don't
    if (_hp) {
      return NextResponse.json({ ok: true, pending: 'verify' });
    }

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vercel injects visitor country automatically — free, no API needed
    const country = request.headers.get('x-vercel-ip-country') || '';

    const { score: spamScore, flags } = calculateSpamScore(name, email, message, country);
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
        payload: { name, email, topic, message, spamScore, flags, status, country },
        expires_at,
      })
      .select('token')
      .single();

    if (!data?.token) {
      return NextResponse.json({ error: 'Failed to create verification token' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    const verifyLink = `${appUrl}/api/contact/verify?token=${data.token}`;

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

    // Admin is only notified after the user clicks the verify link (see verify/route.ts)
    return NextResponse.json({ ok: true, pending: 'verify' });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
