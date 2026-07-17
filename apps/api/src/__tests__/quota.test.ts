import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  },
  adminAuth: {},
}));

import { db } from '../lib/firebase.js';
import { checkQuota } from '../middleware/quota.js';

function mockRequest(uid: string): Partial<Request> & { uid: string } {
  return { uid } as unknown as Partial<Request> & { uid: string };
}

function mockNext(): NextFunction {
  return vi.fn();
}

// Wire up db.collection().doc() to a ref whose get() returns the given snapshot.
// checkQuota now only READS + checks; the slot is consumed in generate.ts on
// success, so the middleware must not increment.
function setupUser(snapshot: { exists: boolean; data?: () => unknown }) {
  const ref = {
    get: vi.fn().mockResolvedValue(snapshot),
    set: vi.fn(),
  };
  const docMock = vi.fn().mockReturnValue(ref);
  vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);
  return ref;
}

function userSnap(tier: string, generationsUsed: number) {
  return { exists: true, data: () => ({ tier, generationsUsed }) };
}

describe('checkQuota middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows free user with 0 generations used without reserving a slot', async () => {
    const ref = setupUser(userSnap('free', 0));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    // Must NOT consume here — that happens after a successful generation.
    expect(ref.set).not.toHaveBeenCalled();
  });

  it('blocks free user at the 1-generation limit', async () => {
    setupUser(userSnap('free', 1));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    const callArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(callArg?.code).toBe('QUOTA_EXCEEDED');
  });

  it('allows pro user below the 10-generation limit', async () => {
    setupUser(userSnap('pro', 9));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks pro user at the 10-generation limit', async () => {
    setupUser(userSnap('pro', 10));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    const callArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(callArg?.code).toBe('QUOTA_EXCEEDED');
  });

  it('never blocks studio user (Infinity limit)', async () => {
    setupUser(userSnap('studio', 99999));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('creates the doc (0 used) and allows generation when the user has no doc yet', async () => {
    const ref = setupUser({ exists: false });
    const next = mockNext();
    await checkQuota(mockRequest('newuid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(ref.set).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'free', generationsUsed: 0 }),
    );
  });
});
