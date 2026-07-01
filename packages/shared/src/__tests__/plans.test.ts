import { describe, it, expect } from 'vitest';
import { PLANS, getPlanById } from '../plans.js';

describe('PLANS', () => {
  it('free plan has limit of 2', () => {
    expect(PLANS.free.monthlyLimit).toBe(2);
    expect(PLANS.free.price).toBe(0);
  });

  it('lite plan has limit of 10 at $0.99', () => {
    expect(PLANS.lite.monthlyLimit).toBe(10);
    expect(PLANS.lite.price).toBe(0.99);
  });

  it('pro plan has limit of 30 at $2.22', () => {
    expect(PLANS.pro.monthlyLimit).toBe(30);
    expect(PLANS.pro.price).toBe(2.22);
  });

  it('studio plan has Infinity limit at $49', () => {
    expect(PLANS.studio.monthlyLimit).toBe(Infinity);
    expect(PLANS.studio.price).toBe(49);
  });

  it('studio limit skips quota check', () => {
    expect(PLANS.studio.monthlyLimit === Infinity).toBe(true);
  });
});

describe('getPlanById', () => {
  it('returns the correct plan', () => {
    expect(getPlanById('free')).toBe(PLANS.free);
    expect(getPlanById('pro')).toBe(PLANS.pro);
    expect(getPlanById('studio')).toBe(PLANS.studio);
  });

  it('returns undefined for unknown id', () => {
    expect(getPlanById('enterprise')).toBeUndefined();
  });
});
