import type { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase.js';
import { PLANS, QuotaExceededError, NotFoundError } from '@trendy/shared';
import type { PlanId } from '@trendy/shared';

const OWNER_EMAIL = 'araiakhylbek78@gmail.com';

export async function checkQuota(req: Request, _res: Response, next: NextFunction) {
  try {
    const userRef = db.collection('users').doc(req.uid);

    // Atomic transaction: read current usage and reserve a slot in one operation.
    // This prevents race conditions where two simultaneous requests both pass
    // the check before either increments the counter.
    const allowed = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (!snap.exists) throw new NotFoundError('User');

      const user = snap.data()!;

      // Owner always bypasses quota
      if ((user['email'] as string | undefined)?.toLowerCase() === OWNER_EMAIL) {
        return true;
      }

      const tier = (user['tier'] as PlanId) ?? 'free';
      const plan = PLANS[tier] ?? PLANS.free;

      if (plan.monthlyLimit === Infinity) return true;

      const used = (user['generationsUsed'] as number) ?? 0;
      if (used >= plan.monthlyLimit) return false;

      // Reserve the slot now — generation.ts no longer needs to increment
      t.update(userRef, {
        generationsUsed: used + 1,
        updatedAt: new Date().toISOString(),
      });
      return true;
    });

    if (!allowed) return next(new QuotaExceededError());
    next();
  } catch (e) {
    next(e);
  }
}
