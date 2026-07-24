import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  sendAdminExternalVerificationEmail,
  sendExternalVerificationHoldEmail,
} from '@/lib/email/sendExternalVerificationEmail';
import { sendSMS } from '@/lib/services/telnyx';

export type EscalationSource = 'risk_engine' | 'admin_escalation' | 'inspection_failure';

export interface EscalationParams {
  matchId:       string;
  declarationId: string | null;
  senderEmail:   string;
  travelerEmail: string;
  fromCity:      string;
  toCity:        string;
  reason:        string;
  source:        EscalationSource;
  riskScore?:    number;
  flags?:        string[];
  nowIso:        string;
}

export async function escalateToExternalVerification(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  params: EscalationParams,
) {
  const {
    matchId, declarationId, senderEmail, travelerEmail,
    fromCity, toCity, reason, source,
    riskScore = 0, flags = [], nowIso,
  } = params;

  const requestedBy = source === 'risk_engine'
    ? 'risk_engine'
    : source === 'inspection_failure'
    ? 'inspection_auto_escalation'
    : 'admin';

  const performedBy = source === 'risk_engine'
    ? 'risk_engine'
    : source === 'inspection_failure'
    ? 'system'
    : 'admin';

  await supabase.from('matches').update({
    status:                            'external_verification_required',
    external_verification_required_at: nowIso,
  }).eq('id', matchId);

  await supabase.from('shipment_verification_requests').insert({
    match_id:      matchId,
    status:        'pending',
    reason,
    requested_by:  requestedBy,
    requested_at:  nowIso,
  });

  await supabase.from('shipment_events').insert({
    match_id:       matchId,
    declaration_id: declarationId,
    event_type:     'EXTERNAL_VERIFICATION_REQUESTED',
    performed_by:   performedBy,
    metadata:       { source, reason, score: riskScore, flags },
  });

  const adminEmailSource = source === 'inspection_failure' ? 'risk_engine' : source;
  const adminPhone = process.env.ADMIN_PHONE;

  await Promise.allSettled([
    sendAdminExternalVerificationEmail({
      matchId, fromCity, toCity, senderEmail, travelerEmail,
      riskScore, flags, reason,
      source: adminEmailSource as 'risk_engine' | 'admin_escalation',
    }),
    adminPhone && sendSMS(
      adminPhone,
      `[BOOTHOP EXT_VERIF] ${fromCity}→${toCity} src:${source} reason:${reason} Match:${matchId}`
    ).catch(() => {}),
    senderEmail   && sendExternalVerificationHoldEmail({ toEmail: senderEmail,   fromCity, toCity, matchId, role: 'sender' }),
    travelerEmail && sendExternalVerificationHoldEmail({ toEmail: travelerEmail, fromCity, toCity, matchId, role: 'traveler' }),
  ]);
}
