export interface UserFacingLabel {
  label: string;
  description: string;
}

const FALLBACK: UserFacingLabel = {
  label: 'Status updated',
  description: 'Your shipment status was updated.',
};

const LABELS: Partial<Record<string, UserFacingLabel>> = {
  SHIPMENT_LOCKED: {
    label: 'Payment secured',
    description: 'Your payment has been held in escrow. The item declaration window is now open.',
  },
  DECLARATION_DRAFT_SAVED: {
    label: 'Declaration in progress',
    description: 'The sender has started their item declaration.',
  },
  DECLARATION_SUBMITTED: {
    label: 'Declaration submitted',
    description: 'The item declaration has been submitted to BootHop for review.',
  },
  COMPLIANCE_REVIEW_STARTED: {
    label: 'Review started',
    description: 'BootHop Safety & Compliance has begun reviewing the declaration.',
  },
  COMPLIANCE_APPROVED: {
    label: 'Shipment approved',
    description: 'The declaration has been approved. Next steps have been unlocked.',
  },
  COMPLIANCE_REJECTED: {
    label: 'Declaration rejected',
    description: 'The declaration was not approved. A refund will be issued within 3–5 business days.',
  },
  COMPLIANCE_TIMEOUT: {
    label: 'Declaration window expired',
    description: 'The 48-hour declaration window passed without a submission. This booking has been cancelled.',
  },
  SHIPMENT_SUSPENDED: {
    label: 'Shipment paused',
    description: 'This shipment has been paused pending further review. BootHop will be in touch.',
  },
  SHIPMENT_CANCELLED_TIMEOUT: {
    label: 'Shipment cancelled',
    description: 'This shipment was cancelled due to inactivity.',
  },
  SHIPMENT_SEALED: {
    label: 'Package sealed',
    description: 'The package has been sealed and is ready for transit.',
  },
  EXTERNAL_VERIFICATION_REQUESTED: {
    label: 'External verification required',
    description: 'Independent verification of this item is required before it can proceed.',
  },
  EXTERNAL_VERIFICATION_COMPLETED: {
    label: 'External verification complete',
    description: 'Independent verification has been completed. The handover inspection is now available.',
  },
  INSPECTION_UNLOCKED: {
    label: 'Inspection ready',
    description: 'The handover inspection checklist is now available to the carrier.',
  },
  INSPECTION_PASSED: {
    label: 'Inspection passed',
    description: 'The carrier completed the handover inspection and accepted the item.',
  },
  INSPECTION_FAILED: {
    label: 'Inspection could not be completed',
    description: 'The carrier was unable to complete the inspection. BootHop has been notified.',
  },
  SECURESEAL_GENERATED: {
    label: 'SecureSeal issued',
    description: 'The BootHop SecureSeal label has been generated and is ready to be applied.',
  },
  SECURESEAL_ACTIVATED: {
    label: 'SecureSeal activated',
    description: 'The SecureSeal has been applied and activated. Contact details are now released.',
  },
  SECURESEAL_SENDER_CONFIRMED: {
    label: 'Seal confirmed by sender',
    description: 'The sender has confirmed the SecureSeal activation.',
  },
  DELIVERY_PIN_GENERATED: {
    label: 'Delivery PIN sent',
    description: 'A delivery PIN has been sent to the sender to share with the receiver.',
  },
  DELIVERY_PIN_LOCKED: {
    label: 'Delivery verification paused',
    description: 'Too many incorrect PIN attempts. Please contact BootHop support to unlock delivery.',
  },
  DELIVERY_PIN_CONFIRMED: {
    label: 'PIN verified',
    description: 'The delivery PIN was entered correctly.',
  },
  DELIVERY_CONFIRMED: {
    label: 'Delivery complete',
    description: 'Delivery has been confirmed. Payment will be released within 24 hours.',
  },
  DELIVERY_ISSUE_REPORTED: {
    label: 'Issue reported',
    description: 'A delivery issue has been reported. Payment is on hold while BootHop investigates.',
  },
  DISPUTE_AUTO_OPENED: {
    label: 'Dispute opened',
    description: 'A dispute has been opened. Our team will review it and contact both parties within 48 hours.',
  },
};

// RISK_ASSESSMENT_COMPLETED and SHIPMENT_LOCK_OVERRIDDEN are intentionally excluded
// — they reveal internal risk scoring and admin override details. Both fall to FALLBACK.

export function getUserFacingLabel(eventType: string): UserFacingLabel {
  return LABELS[eventType] ?? FALLBACK;
}
