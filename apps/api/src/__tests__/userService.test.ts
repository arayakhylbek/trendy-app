import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  },
  adminAuth: {
    verifyIdToken: vi.fn(),
    getUser: vi.fn(),
  },
}));

import { db } from '../lib/firebase.js';
import { ensureUser } from '../services/userService.js';

describe('ensureUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new user doc when one does not exist', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    const getMock = vi.fn().mockResolvedValue({ exists: false });
    const docMock = vi.fn().mockReturnValue({ get: getMock, set: setMock });
    vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);

    await ensureUser('uid-123', { email: 'test@example.com', displayName: 'Test User' });

    expect(setMock).toHaveBeenCalledOnce();
    const savedDoc = setMock.mock.calls[0]![0];
    expect(savedDoc.uid).toBe('uid-123');
    expect(savedDoc.email).toBe('test@example.com');
    expect(savedDoc.tier).toBe('free');
    expect(savedDoc.generationsUsed).toBe(0);
  });

  it('does not overwrite an existing user doc (idempotent)', async () => {
    const setMock = vi.fn();
    const getMock = vi.fn().mockResolvedValue({ exists: true });
    const docMock = vi.fn().mockReturnValue({ get: getMock, set: setMock });
    vi.mocked(db.collection).mockReturnValue({ doc: docMock } as unknown as ReturnType<typeof db.collection>);

    await ensureUser('uid-existing');

    expect(setMock).not.toHaveBeenCalled();
  });
});
