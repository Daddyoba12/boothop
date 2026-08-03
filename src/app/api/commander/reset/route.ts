import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/commander';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ ok: true });

  const db = createSupabaseAdminClient();
  const { data: client } = await db
    .from('pipeline_clients')
    .select('id, company, email, recovery_email, is_super_admin')
    .eq('slug', slug.trim().toLowerCase())
    .single();

  // Always return ok to prevent enumeration
  if (!client) return NextResponse.json({ ok: true });

  // Generate a random 10-character temporary password
  const tempPassword = randomBytes(8).toString('base64url').slice(0, 10);

  await db.from('pipeline_clients').update({
    password_hash:    hashPassword(tempPassword),
    is_temp_password: true,
  }).eq('id', client.id);

  // Super users: always send to recovery_email (titobalo12@gmail.com)
  // Regular clients: send to their stored email
  const sendTo = (client.is_super_admin && client.recovery_email)
    ? client.recovery_email
    : (client.email ?? '');

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from:    'BootHop Pipeline <noreply@boothop.com>',
    to:      sendTo,
    subject: `Your temporary Commander password — ${client.company}`,
    html: `
      <p>Hi ${client.company},</p>
      <p>Your temporary Commander password is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${tempPassword}</p>
      <p>Sign in at <a href="${process.env.NEXT_PUBLIC_APP_URL}/commander">${process.env.NEXT_PUBLIC_APP_URL}/commander</a></p>
      <p>You will be prompted to set your own password immediately after signing in.</p>
      <p>If you didn't request this, contact support.</p>
      <p>— BootHop Pipeline</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
