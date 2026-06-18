import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { CheckoutRequestSchema, PLANS, ValidationError, AppError } from '@trendy/shared';
import { createCheckoutSession, createCustomerPortalSession } from '../services/polarService.js';
import { adminAuth } from '../lib/firebase.js';

const router = Router();

router.post('/checkout', ensureAuth, rateLimit(5), async (req, res, next) => {
  try {
    const parsed = CheckoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { planId } = parsed.data;
    const plan = PLANS[planId];

    const productId = plan.polarProductId;
    if (!productId) {
      return next(new ValidationError('Invalid plan'));
    }

    const authUser = await adminAuth.getUser(req.uid);
    const successUrl = `${process.env['APP_BASE_URL']}/billing/success?plan=${planId}`;

    const checkoutUrl = await createCheckoutSession(
      productId,
      successUrl,
      authUser.email
    );

    res.json({ checkoutUrl });
  } catch (e) {
    next(e);
  }
});

router.post('/portal', ensureAuth, async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.uid).get();
    const polarCustomerId = snap.data()?.['polarCustomerId'] as string | undefined;

    if (!polarCustomerId) {
      return next(new AppError('NO_BILLING_ACCOUNT', 'No billing account found', 400));
    }

    const portalUrl = await createCustomerPortalSession(polarCustomerId);
    res.json({ portalUrl });
  } catch (e) {
    next(e);
  }
});

export default router;
