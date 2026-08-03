import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/admin-session';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true });

  const db = createSupabaseAdminClient();
  const { data: admin } = await db
    .from('admin_accounts')
    .select('id, recovery_email')
    .eq('email', email.trim().toLowerCase())
    .single();

  // Always return ok to prevent enumeration
  if (!admin) return NextResponse.json({ ok: true });

  const tempPassword = randomBytes(8).toString('base64url').slice(0, 10);

  await db.from('admin_accounts').update({
    password_hash:    hashPassword(tempPassword),
    is_temp_password: true,
  }).eq('id', admin.id);

  const sendTo = admin.recovery_email ?? email.trim();

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from:    'BootHop Admin <noreply@boothop.com>',
    to:      sendTo,
    subject: 'Your temporary BootHop Admin password',
    html: `
      <p>Your temporary BootHop Admin password is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:3px;font-family:monospace;">${tempPassword}</p>
      <p>Sign in at <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/login">${process.env.NEXT_PUBLIC_APP_URL}/admin/login</a></p>
      <p>You will be prompted to set your own password immediately after signing in.</p>
      <p>— BootHop</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
