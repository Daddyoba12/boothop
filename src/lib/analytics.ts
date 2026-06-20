declare global {
  function gtag(...args: unknown[]): void;
}

type GaEvent =
  | 'sign_up'
  | 'login'
  | 'begin_checkout'
  | 'purchase'
  | 'booking_submitted'
  | 'match_accepted'
  | 'trip_published'
  | 'kyc_started'
  | 'kyc_completed'
  | 'contact_form_sent'
  | 'booter_applied'
  | 'business_applied';

export function trackEvent(
  event: GaEvent,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof gtag === 'undefined') return;
  gtag('event', event, params ?? {});
}
