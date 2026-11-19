export const PRODUCT_NAME = 'BESS Command Center';
export const PRODUCT_TAGLINE = 'Intelligent battery energy storage site monitoring and predictive health analytics.';
export const DEMO_REFERENCE_ISO = '2026-11-19T10:00:00.000Z';

export function getDemoNow() {
  return new Date(DEMO_REFERENCE_ISO);
}

export function getDemoToday() {
  return DEMO_REFERENCE_ISO.slice(0, 10);
}
