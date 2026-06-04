import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// ── Device fingerprint helpers (called from /api/fingerprint too) ──────────
export async function isDeviceBanned(fingerprint: string): Promise<boolean> {
  if (!fingerprint) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('device_fingerprints')
    .select('is_banned')
    .eq('fingerprint', fingerprint)
    .eq('is_banned', true)
    .maybeSingle();
  return !!data;
}

export async function banDevice(fingerprint: string, reason: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('device_fingerprints')
    .update({ is_banned: true, ban_reason: reason })
    .eq('fingerprint', fingerprint);
}

// ── Currency-localised fraud fee ───────────────────────────────────────────
const FRAUD_FEE_BY_COUNTRY: Record<string, { amount: number; currency: string }> = {
  GB: { amount: 200,    currency: 'gbp' },
  US: { amount: 200,    currency: 'usd' },
  CA: { amount: 200,    currency: 'cad' },
  AU: { amount: 200,    currency: 'aud' },
  NG: { amount: 300000, currency: 'ngn' },
  // EU → €2
  DE: { amount: 200, currency: 'eur' }, FR: { amount: 200, currency: 'eur' },
  ES: { amount: 200, currency: 'eur' }, IT: { amount: 200, currency: 'eur' },
  NL: { amount: 200, currency: 'eur' }, BE: { amount: 200, currency: 'eur' },
  PT: { amount: 200, currency: 'eur' }, IE: { amount: 200, currency: 'eur' },
  AT: { amount: 200, currency: 'eur' }, PL: { amount: 200, currency: 'eur' },
  SE: { amount: 200, currency: 'eur' }, DK: { amount: 200, currency: 'eur' },
  FI: { amount: 200, currency: 'eur' }, NO: { amount: 200, currency: 'eur' },
  CH: { amount: 200, currency: 'eur' },
};

export function getFraudFee(country: string): { amount: number; currency: string } {
  return FRAUD_FEE_BY_COUNTRY[country?.toUpperCase()] ?? { amount: 200, currency: 'gbp' };
}

// ── Types ──────────────────────────────────────────────────────────────────
export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface FraudResult {
  score: number;
  tier: RiskTier;
  fraudFee: { amount: number; currency: string };
  factors: { identityScore: number; behaviourScore: number; transactionScore: number; routeScore: number; deviceBonus: number };
  requiresIdentity: boolean;
  requiresBan: boolean;
  requiresAccountBan: boolean;
  requiresBlock: boolean;
}

function getRiskTier(score: number): RiskTier {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ── Identity factor (30%) ──────────────────────────────────────────────────
async function getIdentityScore(email: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('stripe_verification_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_onboarding_completed')
    .eq('email', email)
    .maybeSingle();
  if (!user) return 80;
  let score = 0;
  if (!user.stripe_onboarding_completed)              score += 30;
  if (!user.stripe_connect_charges_enabled)           score += 20;
  if (!user.stripe_connect_payouts_enabled)           score += 20;
  if (user.stripe_verification_status !== 'verified') score += 10;
  return Math.min(score, 100);
}

// ── Behaviour factor (30%) ─────────────────────────────────────────────────
async function getBehaviourScore(email: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const [{ count: cancellations }, { count: ghostIncidents }] = await Promise.all([
    supabase.from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`sender_email.eq.${email},traveler_email.eq.${email}`)
      .eq('status', 'cancelled'),
    supabase.from('ghost_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('traveller_email', email)
      .eq('status', 'open'),
  ]);
  let score = 0;
  score += Math.min((cancellations ?? 0) * 10, 50);
  score += Math.min((ghostIncidents ?? 0) * 30, 60);
  return Math.min(score, 100);
}

// ── Transaction factor (20%) ───────────────────────────────────────────────
async function getTransactionScore(matchId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data: match } = await supabase
    .from('matches')
    .select('agreed_price, goods_value')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) return 30;
  let score = 0;
  const price = match.agreed_price ?? 0;
  const goods = match.goods_value  ?? 0;
  if (price > 500)  score += 20;
  if (price > 1000) score += 20;
  if (goods > 1000) score += 20;
  if (goods > 3000) score += 20;
  return Math.min(score, 100);
}

// ── Device factor (bonus, up to +30 pts) ──────────────────────────────────
async function getDeviceBonus(email: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data: rows } = await supabase
    .from('device_fingerprints')
    .select('fingerprint, is_banned')
    .eq('email', email);

  if (!rows?.length) return 0;

  // Any banned fingerprint linked to this account = critical signal
  if (rows.some(r => r.is_banned)) return 40;

  // Check if any of this account's fingerprints are shared with other accounts
  const fps = rows.map(r => r.fingerprint);
  const { count: sharedWith } = await supabase
    .from('device_fingerprints')
    .select('email', { count: 'exact', head: true })
    .in('fingerprint', fps)
    .neq('email', email);

  if ((sharedWith ?? 0) > 1) return 20; // same device, 2+ accounts = potential sock puppet

  return 0;
}

// ── Route factor (20%) ─────────────────────────────────────────────────────
const HIGH_RISK_COUNTRIES   = new Set(['NG','GH','KE','SN','CI','CM','UG','TZ']);
const MEDIUM_RISK_COUNTRIES = new Set(['CN','IN','PK','BD','ET','EG','MA']);

function getRouteScore(senderCountry: string, travellerCountry: string): number {
  const hi = HIGH_RISK_COUNTRIES.has(senderCountry.toUpperCase()) || HIGH_RISK_COUNTRIES.has(travellerCountry.toUpperCase());
  const md = MEDIUM_RISK_COUNTRIES.has(senderCountry.toUpperCase()) || MEDIUM_RISK_COUNTRIES.has(travellerCountry.toUpperCase());
  if (hi) return 60;
  if (md) return 30;
  return 0;
}

// ── Main evaluation ────────────────────────────────────────────────────────
export async function evaluateFraud(
  matchId: string,
  senderEmail: string,
  ipCountry: string,
  travellerCountry = ''
): Promise<FraudResult> {
  const [identityScore, behaviourScore, transactionScore, deviceBonus] = await Promise.all([
    getIdentityScore(senderEmail),
    getBehaviourScore(senderEmail),
    getTransactionScore(matchId),
    getDeviceBonus(senderEmail),
  ]);
  const routeScore = getRouteScore(ipCountry, travellerCountry);

  const weighted = Math.round(
    identityScore    * 0.30 +
    behaviourScore   * 0.30 +
    transactionScore * 0.20 +
    routeScore       * 0.20
  );
  // Device bonus adds up to 30 points on top of the weighted score
  const score = Math.min(weighted + Math.round(deviceBonus * 0.75), 100);

  const tier     = getRiskTier(score);
  const fraudFee = getFraudFee(ipCountry);

  return {
    score,
    tier,
    fraudFee,
    factors: { identityScore, behaviourScore, transactionScore, routeScore, deviceBonus },
    requiresIdentity:   tier !== 'low',
    requiresBan:        tier === 'high' || tier === 'critical',
    requiresAccountBan: tier === 'critical',
    requiresBlock:      tier === 'critical',
  };
}

// ── Blocking helpers ───────────────────────────────────────────────────────
export async function banIp(ipAddress: string, reason: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('banned_ips').upsert({ ip_address: ipAddress, reason }, { onConflict: 'ip_address' });
}

export async function banAccount(email: string, reason: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await Promise.all([
    supabase.from('banned_accounts').upsert({ email, reason }, { onConflict: 'email' }),
    supabase.from('users').update({ account_status: 'banned' }).eq('email', email),
  ]);
}

export async function isIpBanned(ipAddress: string): Promise<boolean> {
  if (!ipAddress) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('banned_ips')
    .select('id, expires_at')
    .eq('ip_address', ipAddress)
    .maybeSingle();
  if (!data) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function isAccountBanned(email: string): Promise<boolean> {
  if (!email) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('banned_accounts')
    .select('id, expires_at')
    .eq('email', email)
    .maybeSingle();
  if (!data) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}

// ── Log fraud event ────────────────────────────────────────────────────────
export async function logFraudFlag(
  email: string,
  result: FraudResult,
  matchId?: string,
  ipAddress?: string,
  actionTaken?: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  try {
    await supabase.from('fraud_flags').insert({
      match_id:     matchId,
      email,
      ip_address:   ipAddress,
      risk_score:   result.score,
      risk_tier:    result.tier,
      factors:      result.factors,
      action_taken: actionTaken,
    });
  } catch { /* non-fatal */ }
}
