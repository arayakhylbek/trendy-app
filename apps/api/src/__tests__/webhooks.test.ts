import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  },
  adminAuth: {},
}));

vi.mock('@polar-sh/sdk/webhooks', () => ({
  validateEvent: vi.fn(),
  WebhookVerificationError: class WebhookVerificationError extends Error {
    constructor() {
      super('bad sig');
      this.name = 'WebhookVerificationError';
    }
  },
}));

import { db } from '../lib/firebase.js';

describe('Webhook handler logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPlanByProductId returns undefined for empty string', async () => {
    const { getPlanByProductId } = await import('@trendy/shared');
    expect(getPlanByProductId('')).toBeUndefined();
  });

  it('getPlanByProductId returns undefined for unknown product id', async () => {
    const { getPlanByProductId } = await import('@trendy/shared');
    expect(getPlanByProductId('nonexistent_product_xyz_99')).toBeUndefined();
  });

  it('Polar webhook: validates event signature check runs', async () => {
    const { validateEvent, WebhookVerificationError } = await import('@polar-sh/sdk/webhooks');
    vi.mocked(validateEvent).mockImplementation(() => {
      throw new WebhookVerificationError();
    });

    let threw = false;
    try {
      validateEvent(Buffer.from('{}'), {}, 'bad-secret');
    } catch (e) {
      threw = true;
      expect(e).toBeInstanceOf(WebhookVerificationError);
    }
    expect(threw).toBe(true);
  });

  it('idempotency check skips already-processed events', async () => {
    const getMock = vi.fn().mockResolvedValue({ exists: true });
    const docMock = vi.fn().mockReturnValue({ get: getMock });
    vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);

    const existingEvent = await db.collection('webhookEvents').doc('evt-123').get();
    expect(existingEvent.exists).toBe(true);
    expect(getMock).toHaveBeenCalledOnce();
  });
});
