import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { name, email, topic, message } = await request.json();

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const expires_at = new Date(Date.now() + 24 * 3_600_000).toISOString();

    const { data } = await supabase
      .from('action_tokens')
      .insert({
        email,
        action_type: 'verify_contact',
        entity_id: crypto.randomUUID(),
        payload: { name, email, topic, message },
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
        "Thanks for getting in touch! Please confirm your email address by clicking the link below.",
        'Your message will be delivered to our support team once verified.',
        '',
        `Verify: ${verifyLink}`,
        '',
        'This link expires in 24 hours.',
        '',
        '— The BootHop Team',
      ].join('\n'),
    });

    return NextResponse.json({ ok: true, pending: 'verify' });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
