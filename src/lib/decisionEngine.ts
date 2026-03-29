// BootHop Decision Engine
// Maps a risk score + rules-DB match → one of three platform outcomes

export type ComplianceStatus = 'ALLOWED' | 'RESTRICTED' | 'PROHIBITED';

export interface Decision {
  status:  ComplianceStatus;
  action:  'CONTINUE' | 'ADMIN_REVIEW' | 'BLOCK';
  label:   string;   // human-readable display
  color:   'green' | 'amber' | 'red';
  message: string;
}

// Score thresholds (tune as needed)
const BLOCK_THRESHOLD      = 80;
const ADMIN_REVIEW_THRESHOLD = 50;

export function getDecision(
  score: number,
  rulesStatus: ComplianceStatus,
): Decision {

  // Hard rules always win — if rules say PROHIBITED, block regardless of score
  if (rulesStatus === 'PROHIBITED') {
    return {
      status:  'PROHIBITED',
      action:  'BLOCK',
      label:   '❌ Prohibited',
      color:   'red',
      message: 'This item is prohibited at the destination. This booking cannot proceed.',
    };
  }

  // Score-based escalation for RESTRICTED items or high-risk generics
  if (score >= BLOCK_THRESHOLD) {
    return {
      status:  'PROHIBITED',
      action:  'BLOCK',
      label:   '❌ Blocked — Critical Risk',
      color:   'red',
      message: `Risk score ${score}/100. This combination of item, route, and user profile cannot proceed.`,
    };
  }

  if (rulesStatus === 'RESTRICTED' || score >= ADMIN_REVIEW_THRESHOLD) {
    return {
      status:  'RESTRICTED',
      action:  'ADMIN_REVIEW',
      label:   '⚠️ Restricted — Admin Review',
      color:   'amber',
      message: `Risk score ${score}/100. This item may require a licence, inspection, or declaration. It will be flagged for admin review before matching.`,
    };
  }

  return {
    status:  'ALLOWED',
    action:  'CONTINUE',
    label:   '✅ Allowed',
    color:   'green',
    message: `Risk score ${score}/100. No restrictions found for this item and route. You may proceed.`,
  };
}
