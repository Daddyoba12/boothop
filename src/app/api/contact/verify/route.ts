import { NextRequest, NextResponse } from 'next/server';
import { sendResendEmail } from '@/lib/resend-client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

  if (!token) {
    return NextResponse.redirect(`${appUrl}/contact?error=missing_token`);
  }

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('action_tokens')
    .select('email, payload, expires_at, action_type')
    .eq('token', token)
    .eq('action_type', 'verify_contact')
    .maybeSingle();

  if (!data) {
    return NextResponse.redirect(`${appUrl}/contact?error=invalid_token`);
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.redirect(`${appUrl}/contact?error=expired_token`);
  }

  const { name, email, topic, message, spamScore, flags, status, country } = data.payload as {
    name: string; email: string; topic: string; message: string;
    spamScore?: number; flags?: string[]; status?: string; country?: string;
  };

  // Delete token first to prevent reuse
  await supabase.from('action_tokens').delete().eq('token', token);

  const score = spamScore ?? 0;
  const scoreClass = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  const riskLabel = status === 'REVIEW' ? '⚠️ NEEDS REVIEW' : '✅ VERIFIED';
  const headerBg = status === 'REVIEW' ? '#f57c00' : '#388e3c';
  const flagsHtml = flags?.length
    ? flags.map(f => `<span style="color:#d32f2f;font-weight:bold;">⚠ ${f}</span>`).join('<br>')
    : '✅ All checks passed';

  // Forward verified message to admin — only fires after real email click
  await sendResendEmail({
    from: 'BootHop Contact <noreply@boothop.com>',
    to: ['info@boothop.com', 'titobalo12@gmail.com'],
    replyTo: email,
    subject: `${riskLabel} | [Contact Form] ${topic} — from ${name} (Score: ${score})`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;padding:20px}
      .container{max-width:700px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
      .header{padding:20px;color:white;font-weight:bold;font-size:18px;background:${headerBg}}
      .content{padding:25px}
      .field{margin-bottom:15px}
      .label{font-weight:600;color:#555;font-size:12px;text-transform:uppercase;margin-bottom:4px}
      .value{color:#222;font-size:15px;line-height:1.6}
      .metadata{background:#f9f9f9;padding:15px;border-left:4px solid #ddd;margin-top:20px;border-radius:4px}
      .score{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold}
      .score.high{background:#ffcdd2;color:#c62828}
      .score.medium{background:#ffe0b2;color:#e65100}
      .score.low{background:#c8e6c9;color:#2e7d32}
    </style></head><body>
      <div class="container">
        <div class="header">${riskLabel} — BootHop Contact Form (email verified)</div>
        <div class="content">
          <div class="field"><div class="label">Name</div><div class="value">${name}</div></div>
          <div class="field"><div class="label">Email</div><div class="value"><a href="mailto:${email}">${email}</a></div></div>
          <div class="field"><div class="label">Topic</div><div class="value">${topic}</div></div>
          <div class="field"><div class="label">Message</div><div class="value" style="white-space:pre-wrap">${message}</div></div>
          <div class="metadata">
            <div class="field"><div class="label">IP Country</div><div class="value">${country || 'Unknown'}</div></div>
            <div class="field"><div class="label">Spam Score</div><div class="value"><span class="score ${scoreClass}">${score}/100</span></div></div>
            <div class="field"><div class="label">Validation Flags</div><div class="value">${flagsHtml}</div></div>
          </div>
        </div>
      </div>
    </body></html>`,
    text: `${riskLabel} — email verified\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\nMessage:\n${message}\n\nSpam Score: ${score}/100\nFlags: ${flags?.join(', ') || 'None'}`,
  });

  // WhatsApp notification to operator (+44-7405-746302)
  const waToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (waToken && waPhoneId) {
    const waBody = `${riskLabel}\nBootHop contact from ${name}\nTopic: ${topic}\nEmail: ${email}\n\n${message.slice(0, 300)}`;
    await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '447405746302',
        type: 'text',
        text: { body: waBody },
      }),
    }).catch(() => {});
  }

  return NextResponse.redirect(`${appUrl}/contact?verified=1`);
}
