import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/commander';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { slug, email } = await req.json();
  if (!slug || !email) return NextResponse.json({ ok: true }); // silent

  const db = createSupabaseAdminClient();
  const { data: client } = await db
    .from('pipeline_clients')
    .select('id, company, email, recovery_email, is_super_admin')
    .eq('slug', slug.trim().toLowerCase())
    .single();

  // Always return ok to prevent enumeration
  if (!client) return NextResponse.json({ ok: true });

  const submittedEmail  = email.trim().toLowerCase();
  const submittedDomain = submittedEmail.includes('@') ? submittedEmail.split('@')[1] : '';
  const storedDomain    = client.email?.includes('@') ? client.email.split('@')[1].toLowerCase() : '';

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Domain guard: if the account has a required domain and the submitted email doesn't match
  if (storedDomain && submittedDomain !== storedDomain) {
    // Send a notification to the wrong email address explaining the requirement
    await resend.emails.send({
      from:    'BootHop Pipeline <noreply@boothop.com>',
      to:      submittedEmail,
      subject: `Password reset for ${client.company} — action required`,
      html: `
        <p>Hi,</p>
        <p>A password reset was requested for the <strong>${client.company}</strong> account.</p>
        <p>To reset your password, you must use an email address with the domain
           <strong>@${storedDomain}</strong>.</p>
        <p>Please request a new password reset using your <strong>@${storedDomain}</strong>
           email address.</p>
        <p>If you did not request this, you can ignore this message.</p>
        <p>— BootHop Pipeline</p>
      `,
    }).catch(() => {}); // don't let email failure break the response
    return NextResponse.json({ ok: true });
  }

  // Passed domain check — generate temp password and send reset email
  const tempPassword = randomBytes(8).toString('base64url').slice(0, 10);

  await db.from('pipeline_clients').update({
    password_hash:    hashPassword(tempPassword),
    is_temp_password: true,
    email:            submittedEmail, // update stored email to the confirmed domain email
  }).eq('id', client.id);

  // Super users always get reset sent to recovery_email
  const sendTo = (client.is_super_admin && client.recovery_email)
    ? client.recovery_email
    : submittedEmail;

  await resend.emails.send({
    from:    'BootHop Pipeline <noreply@boothop.com>',
    to:      sendTo,
    subject: `Your temporary Commander password — ${client.company}`,
    html: `
      <p>Hi ${client.company},</p>
      <p>Your temporary Commander password is:</p>
      <p style="font-size:26px;font-weight:bold;letter-spacing:3px;font-family:monospace;background:#f4f4f4;padding:12px 20px;border-radius:8px;display:inline-block;">${tempPassword}</p>
      <p>Sign in at <a href="${appUrl}/commander">${appUrl}/commander</a></p>
      <p><strong>You will be prompted to set your own password immediately after signing in.</strong>
         This temporary password cannot be reused once you change it.</p>
      <p>If you didn't request this, contact support immediately.</p>
      <p>— BootHop Pipeline</p>
    `,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
