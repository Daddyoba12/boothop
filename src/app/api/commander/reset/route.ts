import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/commander';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { email, token, newPassword } = await req.json();

  const db = createSupabaseAdminClient();

  // ── Step 1: Request reset ─────────────────────────────────────────────────
  if (email && !token) {
    const { data: client } = await db
      .from('pipeline_clients')
      .select('id, company, slug')
      .eq('email', email.trim().toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!client) return NextResponse.json({ ok: true });

    const rawToken   = randomBytes(32).toString('hex');
    const tokenHash  = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await db.from('commander_reset_tokens').insert({
      client_id:  client.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/commander/reset?token=${rawToken}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    `BootHop Pipeline <noreply@boothop.com>`,
      to:      email.trim(),
      subject: `Reset your Commander password — ${client.company}`,
      html: `
        <p>Hi ${client.company},</p>
        <p>Click the link below to reset your Commander password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, ignore this email.</p>
        <p>— BootHop Pipeline</p>
      `,
    });

    return NextResponse.json({ ok: true });
  }

  // ── Step 2: Confirm reset with token + new password ───────────────────────
  if (token && newPassword) {
    if (newPassword.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const { data: resetRow } = await db
      .from('commander_reset_tokens')
      .select('id, client_id, expires_at, used')
      .eq('token_hash', tokenHash)
      .single();

    if (!resetRow || resetRow.used || new Date(resetRow.expires_at) < new Date())
      return NextResponse.json({ error: 'Reset link is invalid or has expired' }, { status: 400 });

    await db.from('pipeline_clients')
      .update({ password_hash: hashPassword(newPassword) })
      .eq('id', resetRow.client_id);

    await db.from('commander_reset_tokens')
      .update({ used: true })
      .eq('id', resetRow.id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
