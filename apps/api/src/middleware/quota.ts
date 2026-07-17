import type { Request, Response, NextFunction } from 'express';
import { db } from '../lib/firebase.js';
import { PLANS, QuotaExceededError } from '@trendy/shared';
import type { PlanId } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

export async function checkQuota(req: Request, _res: Response, next: NextFunction) {
  try {
    const userRef = db.collection('users').doc(req.uid);

    // Only CHECK the limit here — the slot is consumed in generate.ts AFTER a
    // successful generation, so a failed/timed-out request never costs a slot.
    const snap = await userRef.get();

    // Safety net: a brand-new user who reached generate before /me created their
    // doc. Create it on the free tier (0 used) so the check has something to read.
    if (!snap.exists) {
      const now = new Date().toISOString();
      await userRef.set({
        uid: req.uid,
        email: '',
        displayName: null,
        tier: 'free',
        generationsUsed: 0,
        createdAt: now,
        updatedAt: now,
      });
      return next();
    }

    const user = snap.data()!;

    // Owner always bypasses quota
    if (ADMIN_EMAILS.includes((user['email'] as string | undefined)?.toLowerCase() ?? '')) {
      return next();
    }

    const tier = (user['tier'] as PlanId) ?? 'free';
    const plan = PLANS[tier] ?? PLANS.free;

    if (plan.monthlyLimit === Infinity) return next();

    const used = (user['generationsUsed'] as number) ?? 0;
    const bonus = (user['bonusGenerations'] as number) ?? 0;
    const effectiveLimit = plan.monthlyLimit + bonus;
    if (used >= effectiveLimit) return next(new QuotaExceededError());

    next();
  } catch (e) {
    next(e);
  }
}
