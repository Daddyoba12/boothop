import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { classifyItemWithAI } from './ai-classifier';
import { estimateDutyFromRules, assessRisk, convertToGBP } from './rules-engine';
import type { CustomsInput, CustomsEstimationResult } from './types';

export async function runCustomsEstimation(
  input: CustomsInput
): Promise<CustomsEstimationResult> {
  const supabase = createSupabaseAdminClient();

  // Step 1: AI Classification
  const aiClassification = await classifyItemWithAI(input);

  // Step 2: Duty Estimation from rules DB
  const dutyEstimate = await estimateDutyFromRules(input, aiClassification.detectedCategory);

  // Step 3: Risk Assessment
  const valueGBP = convertToGBP(input.declaredValue, input.currency);
  const riskAssessment = assessRisk(input, aiClassification, valueGBP);

  // Step 4: Save to Supabase
  const { data: saved, error } = await supabase
    .from('customs_estimations')
    .insert({
      shipment_id:          input.shipmentId ?? null,
      user_id:              input.userId ?? null,
      item_category:        aiClassification.detectedCategory,
      declared_value:       input.declaredValue,
      currency:             input.currency,
      origin_country:       input.originCountry,
      destination_country:  input.destinationCountry,
      item_description:     input.itemDescription,
      brand:                input.brand ?? null,
      is_new:               input.isNew ?? true,
      weight_kg:            input.weightKg ?? null,
      ai_category_detected: aiClassification.detectedCategory,
      ai_confidence_score:  aiClassification.confidenceScore,
      ai_hs_suggestion:     aiClassification.hsSuggestion ?? null,
      ai_flags:             aiClassification.flags,
      estimated_vat:        dutyEstimate.estimatedVAT,
      estimated_duty:       dutyEstimate.estimatedDuty,
      estimated_handling:   dutyEstimate.estimatedHandling,
      estimated_total:      dutyEstimate.estimatedTotal,
      estimation_method:    dutyEstimate.method,
      risk_score:           riskAssessment.riskScore,
      risk_level:           riskAssessment.riskLevel,
      risk_flags:           riskAssessment.flags,
      requires_aml_review:  riskAssessment.requiresAMLReview,
      requires_invoice:     riskAssessment.requiresInvoice,
      disclaimer_shown:     true,
    })
    .select()
    .single();

  // Step 5: Queue AML review if required
  if (riskAssessment.requiresAMLReview && saved) {
    await supabase.from('aml_reviews').insert({
      estimation_id: saved.id,
      user_id:       input.userId ?? null,
      status:        'pending',
    });
  }

  return {
    id:               saved?.id ?? 'unsaved',
    input,
    aiClassification,
    dutyEstimate,
    riskAssessment,
    savedToDb:        !error,
  };
}
