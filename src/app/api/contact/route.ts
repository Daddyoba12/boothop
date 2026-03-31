import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, topic, message } = await request.json();

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'BootHop Support <noreply@boothop.co.uk>',
      to: ['support@boothop.co.uk'],
      replyTo: email,
      subject: `[Contact Form] ${topic} — from ${name}`,
      text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
