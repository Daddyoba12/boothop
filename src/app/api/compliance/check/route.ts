import { NextRequest, NextResponse } from 'next/server';
import { rulesDB } from '@/data/complianceRules';
import { classifyItem } from '@/lib/classifier';
import { calculateRisk, RiskInput } from '@/lib/riskEngine';
import { getDecision, ComplianceStatus } from '@/lib/decisionEngine';
import { supabaseAdmin } from '@/lib/supabase.admin';

export interface ComplianceCheckRequest {
  item:      string;
  country:   string;           // destination country
  value?:    number;
  quantity?: number;
  userId?:   string;           // if authenticated, pass user ID for behaviour scoring
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ComplianceCheckRequest;
    const { item, country, value = 0, quantity = 1, userId } = body;

    if (!item || !country) {
      return NextResponse.json(
        { error: 'item and country are required' },
        { status: 400 },
      );
    }

    // ── 1. Classify item ─────────────────────────────────────────────────────
    const category = classifyItem(item);

    // ── 2. Check rules DB ────────────────────────────────────────────────────
    const rules = rulesDB[country];
    const itemLower = item.toLowerCase();

    let rulesStatus: ComplianceStatus = 'ALLOWED';

    if (!rules) {
      rulesStatus = 'RESTRICTED'; // unknown country → flag for review
    } else if (rules.prohibited.some((p) => itemLower.includes(p))) {
      rulesStatus = 'PROHIBITED';
    } else if (rules.restricted.some((r) => itemLower.includes(r) || category === r)) {
      rulesStatus = 'RESTRICTED';
    }

    // ── 3. Fetch user profile for behaviour scoring ──────────────────────────
    let userCtx: RiskInput['user'] | undefined;

    if (userId) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('is_verified, total_deliveries, created_at')
          .eq('id', userId)
          .single();

        if (profile) {
          const daysSinceJoin = profile.created_at
            ? (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000
            : 0;
          userCtx = {
            verified: profile.is_verified ?? false,
            isNew:    (profile.total_deliveries ?? 0) === 0 || daysSinceJoin < 30,
            flagged:  false, // extend when admin flagging is wired up
          };
        }
      } catch {
        // Non-fatal — continue without user context
      }
    }

    // ── 4. Risk score ────────────────────────────────────────────────────────
    const risk = calculateRisk({ item, country, value, quantity, user: userCtx });

    // ── 5. Decision ──────────────────────────────────────────────────────────
    const decision = getDecision(risk.score, rulesStatus);

    // ── 6. Persist to compliance_requests if flagged ─────────────────────────
    if (decision.action !== 'CONTINUE' && userId) {
      try {
        await supabaseAdmin.from('compliance_requests').insert({
          user_id:    userId,
          item,
          country,
          status:     decision.status,
          category,
          risk_score: risk.score,
          action:     decision.action,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-fatal — log but don't fail the request
        console.warn('[compliance] Failed to persist compliance_request');
      }
    }

    return NextResponse.json({
      item,
      country,
      category,
      riskScore:   risk.score,
      breakdown:   risk.breakdown,
      rulesStatus,
      decision,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Compliance check failed';
    console.error('[compliance/check]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
