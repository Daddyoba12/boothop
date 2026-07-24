import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateSealNumber, generateSealToken } from '@/lib/seals/generate';
import { checkRateLimit } from '@/lib/rate-limit';

const SEAL_EXPIRY_DAYS = 7;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);
  if (!session?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: max 5 generate calls per shipment per minute
  const rl = await checkRateLimit(`seal:gen:${matchId}`, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating a new seal.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, sender_email, traveler_email')
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  if (match.sender_email !== session.email && match.traveler_email !== session.email) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Seal only generatable when inspection has passed and seal activation is pending
  if (match.status !== 'seal_pending') {
    return NextResponse.json({
      error: `SecureSeal can only be generated while shipment is awaiting seal activation (current status: ${match.status})`,
    }, { status: 409 });
  }

  // Idempotency: if an active (not revoked, not expired) seal exists, refresh its token
  // and return it. Refreshing the token invalidates any previously printed QR, preventing
  // two floating valid labels for the same shipment.
  const { data: existingSeal } = await supabase
    .from('shipment_secure_seals')
    .select('id, seal_number, status, generated_at, expires_at')
    .eq('match_id', matchId)
    .not('status', 'in', '("revoked","expired")')
    .maybeSingle();

  if (existingSeal) {
    const { rawToken, tokenHash } = generateSealToken();
    await supabase
      .from('shipment_secure_seals')
      .update({ token_hash: tokenHash, updated_at: new Date().toISOString() })
      .eq('id', existingSeal.id);

    return NextResponse.json({
      idempotent:  true,
      sealNumber:  existingSeal.seal_number,
      token:       rawToken,
      generatedAt: existingSeal.generated_at,
      expiresAt:   existingSeal.expires_at,
      printUrl:    `/matches/${matchId}/seal/print?t=${rawToken}`,
    });
  }

  // Generate a unique seal number (collision extremely unlikely; retry defensively)
  let sealNumber!: string;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSealNumber();
    const { data: collision } = await supabase
      .from('shipment_secure_seals')
      .select('id')
      .eq('seal_number', candidate)
      .maybeSingle();
    if (!collision) { sealNumber = candidate; break; }
  }
  if (!sealNumber) {
    return NextResponse.json({ error: 'Failed to generate a unique seal number. Please try again.' }, { status: 500 });
  }

  const { rawToken, tokenHash } = generateSealToken();
  const expiresAt = new Date(Date.now() + SEAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: seal, error: insertErr } = await supabase
    .from('shipment_secure_seals')
    .insert({
      match_id:    matchId,
      seal_number: sealNumber,
      token_hash:  tokenHash,
      status:      'generated',
      expires_at:  expiresAt,
    })
    .select('id, seal_number, generated_at, expires_at')
    .single();

  if (insertErr || !seal) {
    console.error('Seal insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to create seal. Please try again.' }, { status: 500 });
  }

  await supabase.from('shipment_events').insert({
    match_id:     matchId,
    event_type:   'SECURESEAL_GENERATED',
    performed_by: session.email,
    metadata:     { seal_number: sealNumber, expires_at: expiresAt },
  });

  // Return the raw token once — it is never stored server-side in plaintext
  return NextResponse.json({
    sealNumber:  seal.seal_number,
    token:       rawToken,
    generatedAt: seal.generated_at,
    expiresAt:   seal.expires_at,
    printUrl:    `/matches/${matchId}/seal/print?t=${rawToken}`,
  });
}
