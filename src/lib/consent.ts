// Consent Mode helpers (module 8772). The original Google Analytics / Ads IDs
// are intentionally not carried over.
export function consentState(granted: boolean) {
  return {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: 'denied',
  };
}
