import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { runCustomsEstimation } from '@/lib/customs/customs-service';
import type { CustomsInput } from '@/lib/customs/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<CustomsInput>;

    // Validate required fields
    const required = ['itemDescription', 'declaredValue', 'currency', 'originCountry', 'destinationCountry'] as const;
    for (const field of required) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    if (!body.declaredValue || body.declaredValue <= 0) {
      return NextResponse.json({ error: 'Declared value must be greater than 0' }, { status: 400 });
    }

    // Optional: identify caller if logged in (email used as identifier)
    let callerEmail: string | undefined;
    try {
      const cookieStore = await cookies();
      const session = getAppSession(cookieStore);
      if (session?.email) callerEmail = session.email;
    } catch {
      // Public access — no session required for this endpoint
    }
    void callerEmail; // stored for future use; customs_estimations.user_id requires UUID

    const input: CustomsInput = {
      itemDescription:    body.itemDescription!,
      declaredValue:      body.declaredValue!,
      currency:           body.currency!,
      originCountry:      body.originCountry!,
      destinationCountry: body.destinationCountry!,
      brand:              body.brand,
      isNew:              body.isNew ?? true,
      weightKg:           body.weightKg,
      shipmentId:         body.shipmentId,
    };

    const result = await runCustomsEstimation(input);

    return NextResponse.json({
      success:      true,
      estimationId: result.id,
      category: {
        detected:     result.aiClassification.detectedCategory,
        confidence:   result.aiClassification.confidenceScore,
        hsSuggestion: result.aiClassification.hsSuggestion,
        reasoning:    result.aiClassification.reasoning,
      },
      estimate: {
        vat:        result.dutyEstimate.estimatedVAT,
        duty:       result.dutyEstimate.estimatedDuty,
        handling:   result.dutyEstimate.estimatedHandling,
        total:      result.dutyEstimate.estimatedTotal,
        landedCost: result.dutyEstimate.landedCost,
        currency:   result.dutyEstimate.currency,
        breakdown:  result.dutyEstimate.breakdown,
        disclaimer: result.dutyEstimate.disclaimer,
      },
      risk: {
        score:              result.riskAssessment.riskScore,
        level:              result.riskAssessment.riskLevel,
        flags:              result.riskAssessment.flags,
        requiresAMLReview:  result.riskAssessment.requiresAMLReview,
        requiresInvoice:    result.riskAssessment.requiresInvoice,
        requiresEnhancedID: result.riskAssessment.requiresEnhancedID,
        actions:            result.riskAssessment.actions,
      },
    });
  } catch (err) {
    console.error('[Customs Estimate Error]', err);
    return NextResponse.json({ error: 'Estimation failed. Please try again.' }, { status: 500 });
  }
}
