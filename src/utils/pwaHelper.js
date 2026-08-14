/**
 * PWA & Device Environment Helpers for Tivora
 */

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app') ||
    localStorage.getItem('tivora_is_installed') === 'true' ||
    window.location.search.includes('mode=app')
  );
}

export function isMobileOrTablet() {
  if (typeof window === 'undefined') return false;
  const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|tablet|mobile/i.test(userAgent);
  const isSmallScreen = window.innerWidth < 1024;
  return isMobileUA || isSmallScreen;
}
