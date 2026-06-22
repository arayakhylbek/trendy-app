import type { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase.js';
import { PLANS, QuotaExceededError, NotFoundError } from '@trendy/shared';
import type { PlanId } from '@trendy/shared';

const OWNER_EMAIL = 'araiakhylbek78@gmail.com';

export async function checkQuota(req: Request, _res: Response, next: NextFunction) {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    if (!snap.exists) {
      return next(new NotFoundError('User'));
    }
    const user = snap.data()!;

    // Owner account — unlimited generations, skip quota check
    if ((user['email'] as string | undefined)?.toLowerCase() === OWNER_EMAIL) {
      return next();
    }

    const tier = (user['tier'] as PlanId) ?? 'free';
    const plan = PLANS[tier] ?? PLANS.free;

    if (plan.monthlyLimit === Infinity) {
      return next();
    }

    const used = (user['generationsUsed'] as number) ?? 0;
    if (used >= plan.monthlyLimit) {
      return next(new QuotaExceededError());
    }
    next();
  } catch (e) {
    next(e);
  }
}
