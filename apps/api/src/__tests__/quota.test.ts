import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(),
    runTransaction: vi.fn(),
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

// Wire up db.collection().doc() and a runTransaction that runs the callback
// against a fake transaction whose get() returns the given snapshot.
function setupUser(snapshot: { exists: boolean; data?: () => unknown }) {
  const docMock = vi.fn().mockReturnValue({ id: 'ref' });
  vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);

  const t = {
    get: vi.fn().mockResolvedValue(snapshot),
    set: vi.fn(),
    update: vi.fn(),
  };
  vi.mocked(db.runTransaction).mockImplementation(
    // @ts-expect-error minimal transaction shape for the test
    async (fn) => fn(t),
  );
  return t;
}

function userSnap(tier: string, generationsUsed: number) {
  return { exists: true, data: () => ({ tier, generationsUsed }) };
}

describe('checkQuota middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows free user with 0 generations used and reserves a slot', async () => {
    const t = setupUser(userSnap('free', 0));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(t.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ generationsUsed: 1 }));
  });

  it('blocks free user at the 2-generation limit', async () => {
    setupUser(userSnap('free', 2));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    const callArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(callArg?.code).toBe('QUOTA_EXCEEDED');
  });

  it('allows pro user below the 20-generation limit', async () => {
    setupUser(userSnap('pro', 19));
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks pro user at the 20-generation limit', async () => {
    setupUser(userSnap('pro', 20));
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

  it('creates the doc and allows generation when the user has no doc yet', async () => {
    const t = setupUser({ exists: false });
    const next = mockNext();
    await checkQuota(mockRequest('newuid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(t.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tier: 'free', generationsUsed: 1 }),
    );
  });
});
