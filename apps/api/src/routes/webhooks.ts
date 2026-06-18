import { type Router as ExpressRouter, Router } from 'express';
import express from 'express';
import { db } from '../lib/firebase.js';
import { logger } from '../lib/logger.js';
import { getPlanByProductId } from '../lib/polarConfig.js';

const router: ExpressRouter = Router();

interface SubscriptionData {
  id: string;
  productId: string;
  customerId: string;
  customer: { email: string };
}

interface PolarEvent {
  type?: string;
  data: unknown;
}

router.post('/polar', express.raw({ type: 'application/json' }), async (req, res) => {
  let event: PolarEvent;

  try {
    const { validateEvent } = await import('@polar-sh/sdk/webhooks');
    event = validateEvent(
      req.body as Buffer,
      req.headers as Record<string, string>,
      process.env['POLAR_WEBHOOK_SECRET']!
    ) as PolarEvent;
  } catch (e: unknown) {
    const err = e as { name?: string; constructor?: { name?: string } };
    if (
      err?.name === 'WebhookVerificationError' ||
      err?.constructor?.name === 'WebhookVerificationError'
    ) {
      logger.warn('Polar webhook: signature verification failed');
      res.status(403).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
      return;
    }
    logger.warn({ err: e }, 'Polar webhook: parse error');
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Bad request' } });
    return;
  }

  const eventType = event.type ?? 'unknown';
  const data = event.data as SubscriptionData;

  // Idempotency: use subscription id + event type as key (Polar payloads have no top-level id)
  const idempotencyKey = `${data?.id ?? ''}-${eventType}`;
  const eventRef = db.collection('webhookEvents').doc(idempotencyKey);
  const existing = await eventRef.get();
  if (existing.exists) {
    res.json({ ok: true, skipped: true });
    return;
  }

  try {
    await handlePolarEvent(eventType, data);
    await eventRef.set({
      eventKey: idempotencyKey,
      type: eventType,
      processedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (e) {
    logger.error(e, 'Polar webhook: processing error');
    res.status(500).json({ error: { code: 'PROCESSING_ERROR', message: 'Processing failed' } });
  }
});

async function handlePolarEvent(type: string, data: SubscriptionData) {
  logger.info({ type }, 'Processing Polar webhook');

  if (type === 'subscription.active' || type === 'subscription.updated') {
    const productId = data?.productId;
    const customerId = data?.customerId;
    const customerEmail = data?.customer?.email;

    if (!customerEmail) {
      logger.warn({ type }, 'Webhook: no customer email');
      return;
    }

    const newTier = productId ? (getPlanByProductId(productId) ?? 'free') : 'free';

    const snap = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
    if (snap.empty) {
      logger.warn({ type }, 'Webhook: user not found for email');
      return;
    }

    await snap.docs[0]!.ref.update({
      tier: newTier,
      polarCustomerId: customerId ?? null,
      generationsUsed: 0,
      generationsResetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info({ tier: newTier }, 'Webhook: user tier updated');
  }

  if (type === 'subscription.canceled' || type === 'subscription.revoked') {
    const customerEmail = data?.customer?.email;
    if (!customerEmail) return;

    const snap = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0]!.ref.update({
        tier: 'free',
        updatedAt: new Date().toISOString(),
      });
      logger.info('Webhook: user downgraded to free');
    }
  }
}

export default router;
