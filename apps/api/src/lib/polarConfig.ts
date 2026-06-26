export const POLAR_PRODUCT_IDS = {
  lite: process.env['POLAR_PRODUCT_LITE'] ?? '',
  pro: process.env['POLAR_PRODUCT_PRO'] ?? '',
  studio: process.env['POLAR_PRODUCT_STUDIO'] ?? '',
} as const;

export type PaidPlanId = 'lite' | 'pro' | 'studio';

export function getPlanByProductId(productId: string): PaidPlanId | undefined {
  if (!productId) return undefined;
  if (POLAR_PRODUCT_IDS.lite && POLAR_PRODUCT_IDS.lite === productId) return 'lite';
  if (POLAR_PRODUCT_IDS.pro && POLAR_PRODUCT_IDS.pro === productId) return 'pro';
  if (POLAR_PRODUCT_IDS.studio && POLAR_PRODUCT_IDS.studio === productId) return 'studio';
  return undefined;
}

export function getProductIdByPlan(planId: PaidPlanId): string {
  return POLAR_PRODUCT_IDS[planId];
}
