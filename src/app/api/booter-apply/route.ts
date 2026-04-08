import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, city, vehicle, about } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email and phone number are required.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    await supabase.from('booter_applications').insert({
      name,
      email,
      phone,
      city:    city    || null,
      vehicle: vehicle || null,
      about:   about   || null,
      status:  'pending',
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    'BootHop <noreply@boothop.com>',
      to:      [process.env.ADMIN_EMAIL ?? 'admin@boothop.com'],
      subject: `New Carrier Application — ${name}`,
      text: [
        'New carrier application received.',
        '',
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Phone:   ${phone}`,
        `City:    ${city    || 'Not provided'}`,
        `Vehicle: ${vehicle || 'Not provided'}`,
        '',
        'About:',
        about || 'Not provided',
      ].join('\n'),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('booter-apply error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
