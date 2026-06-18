export const PLANS = {
  free: {
    id: 'free' as const,
    label: 'Free',
    price: 0,
    monthlyLimit: 5,
    features: ['5 generations / month', 'Limited template library', 'Standard quality'],
  },
  pro: {
    id: 'pro' as const,
    label: 'Pro',
    price: 19,
    monthlyLimit: 200,
    features: ['200 generations / month', 'Full daily template library', 'HD downloads'],
  },
  studio: {
    id: 'studio' as const,
    label: 'Studio',
    price: 49,
    monthlyLimit: Infinity,
    features: [
      'Unlimited generations (fair use)',
      'Full library + early access',
      'Priority generation',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

export function getPlanById(id: string): Plan | undefined {
  return PLANS[id as PlanId];
}
