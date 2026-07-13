import type { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase.js';
import { PLANS, QuotaExceededError } from '@trendy/shared';
import type { PlanId } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

export async function checkQuota(req: Request, _res: Response, next: NextFunction) {
  try {
    const userRef = db.collection('users').doc(req.uid);

    // Atomic transaction: read current usage and reserve a slot in one operation.
    // This prevents race conditions where two simultaneous requests both pass
    // the check before either increments the counter.
    const allowed = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);

      // Safety net: a brand-new user who reached generate before /me created
      // their doc. Create it now on the free tier and reserve this first slot.
      if (!snap.exists) {
        const now = new Date().toISOString();
        t.set(userRef, {
          uid: req.uid,
          email: '',
          displayName: null,
          tier: 'free',
          generationsUsed: 1,
          createdAt: now,
          updatedAt: now,
        });
        return true;
      }

      const user = snap.data()!;

      // Owner always bypasses quota
      if (ADMIN_EMAILS.includes((user['email'] as string | undefined)?.toLowerCase() ?? '')) {
        return true;
      }

      const tier = (user['tier'] as PlanId) ?? 'free';
      const plan = PLANS[tier] ?? PLANS.free;

      if (plan.monthlyLimit === Infinity) return true;

      const used = (user['generationsUsed'] as number) ?? 0;
      const bonus = (user['bonusGenerations'] as number) ?? 0;
      const effectiveLimit = plan.monthlyLimit + bonus;
      if (used >= effectiveLimit) return false;

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
