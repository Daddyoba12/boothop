declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify: (params: Record<string, unknown>) => void;
    };
  }
}

type TikTokEvent =
  | 'ViewContent'
  | 'Search'
  | 'InitiateCheckout'
  | 'CompletePayment'
  | 'CompleteRegistration'
  | 'SubmitForm';

export function ttTrack(event: TikTokEvent, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track(event, params ?? {});
}
