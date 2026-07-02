export const PLANS = {
  free: {
    id: 'free' as const,
    label: 'Free',
    price: 0,
    monthlyLimit: 2,
    features: ['2 generations / month', 'Limited template library', 'Standard quality'],
  },
  lite: {
    id: 'lite' as const,
    label: 'Lite',
    price: 0.99,
    monthlyLimit: 10,
    features: ['10 generations / month', 'Full template library', 'HD downloads'],
  },
  pro: {
    id: 'pro' as const,
    label: 'Pro',
    price: 2.22,
    monthlyLimit: 20,
    features: ['20 generations / month', 'Full daily template library', 'HD downloads'],
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
