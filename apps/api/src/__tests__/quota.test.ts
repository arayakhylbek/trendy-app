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

function mockUserDoc(tier: string, generationsUsed: number) {
  const getMock = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ tier, generationsUsed }),
  });
  const docMock = vi.fn().mockReturnValue({ get: getMock });
  vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);
}

describe('checkQuota middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows free user with 0 generations used', async () => {
    mockUserDoc('free', 0);
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks free user at 5 generations', async () => {
    mockUserDoc('free', 5);
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    const callArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(callArg?.code).toBe('QUOTA_EXCEEDED');
  });

  it('allows pro user at 199 generations', async () => {
    mockUserDoc('pro', 199);
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks pro user at 200 generations', async () => {
    mockUserDoc('pro', 200);
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    const callArg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(callArg?.code).toBe('QUOTA_EXCEEDED');
  });

  it('never blocks studio user (Infinity limit)', async () => {
    mockUserDoc('studio', 99999);
    const next = mockNext();
    await checkQuota(mockRequest('uid') as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
