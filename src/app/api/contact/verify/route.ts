import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
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

  const { name, email, topic, message } = data.payload as {
    name: string; email: string; topic: string; message: string;
  };

  // Delete token first to prevent reuse
  await supabase.from('action_tokens').delete().eq('token', token);

  // Forward verified message to admin
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'BootHop Support <noreply@boothop.com>',
    to: ['info@boothop.com'],
    replyTo: email,
    subject: `[Contact Form] ${topic} — from ${name}`,
    text: [
      'New contact form submission (email verified)',
      '',
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Topic:   ${topic}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  });

  return NextResponse.redirect(`${appUrl}/contact?verified=1`);
}
