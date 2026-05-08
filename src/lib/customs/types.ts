export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EstimationMethod = 'rules_engine' | 'ai_enhanced' | 'hybrid';

export interface CustomsInput {
  itemDescription: string;
  declaredValue: number;
  currency: string;
  originCountry: string;
  destinationCountry: string;
  brand?: string;
  isNew?: boolean;
  weightKg?: number;
  userId?: string;
  shipmentId?: string;
}

export interface AIClassificationResult {
  detectedCategory: string;
  confidenceScore: number;
  hsSuggestion?: string;
  flags: string[];
  reasoning: string;
}

export interface DutyEstimate {
  estimatedVAT: number;
  estimatedDuty: number;
  estimatedHandling: number;
  estimatedTotal: number;
  landedCost: number;
  method: EstimationMethod;
  currency: string;
  breakdown: {
    baseValue: number;
    vatRate: number;
    dutyRate: number;
    handlingFee: number;
  };
  disclaimer: string;
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  requiresAMLReview: boolean;
  requiresInvoice: boolean;
  requiresEnhancedID: boolean;
  actions: string[];
}

export interface CustomsEstimationResult {
  id: string;
  input: CustomsInput;
  aiClassification: AIClassificationResult;
  dutyEstimate: DutyEstimate;
  riskAssessment: RiskAssessment;
  savedToDb: boolean;
}
