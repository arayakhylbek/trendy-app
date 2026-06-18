import { Router } from 'express';
import express from 'express';
import { db } from '../lib/firebase.js';
import { logger } from '../lib/logger.js';
import { getPlanByProductId } from '@trendy/shared';

const router = Router();

router.post('/polar', express.raw({ type: 'application/json' }), async (req, res) => {
  let event: { id: string; type: string; data: Record<string, unknown> };

  try {
    const { validateEvent, WebhookVerificationError } = await import('@polar-sh/sdk/webhooks');
    event = validateEvent(
      req.body as Buffer,
      req.headers as Record<string, string>,
      process.env['POLAR_WEBHOOK_SECRET']!
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.name === 'WebhookVerificationError' || e?.constructor?.name === 'WebhookVerificationError') {
      logger.warn('Polar webhook: signature verification failed');
      return res.status(403).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
    }
    logger.warn({ err: e }, 'Polar webhook: parse error');
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Bad request' } });
  }

  const eventRef = db.collection('webhookEvents').doc(event.id);
  const existing = await eventRef.get();
  if (existing.exists) {
    return res.json({ ok: true, skipped: true });
  }

  try {
    await handlePolarEvent(event.type, event.data);
    await eventRef.set({
      eventId: event.id,
      type: event.type,
      processedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (e) {
    logger.error(e, 'Polar webhook: processing error');
    res.status(500).json({ error: { code: 'PROCESSING_ERROR', message: 'Processing failed' } });
  }
});

async function handlePolarEvent(type: string, data: Record<string, unknown>) {
  logger.info({ type }, 'Processing Polar webhook');

  if (type === 'subscription.active' || type === 'subscription.updated') {
    const productId = (data['productId'] ?? data['product_id']) as string | undefined;
    const customerId = (data['customerId'] ?? data['customer_id']) as string | undefined;
    const customer = data['customer'] as Record<string, unknown> | undefined;
    const customerEmail = customer?.['email'] as string | undefined;

    if (!customerEmail) {
      logger.warn({ data: '[omitted for PII]' }, 'Webhook: no customer email');
      return;
    }

    const newPlan = productId ? getPlanByProductId(productId) : undefined;
    const newTier = newPlan?.id ?? 'free';

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
    const customer = data['customer'] as Record<string, unknown> | undefined;
    const customerEmail = customer?.['email'] as string | undefined;
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
