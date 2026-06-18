import { db } from '../lib/firebase.js';
import { UserDocSchema } from '@trendy/shared';

interface AuthUserInfo {
  email?: string;
  displayName?: string | null;
}

export async function ensureUser(uid: string, authUser?: AuthUserInfo): Promise<void> {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;

  const now = new Date().toISOString();
  const doc = UserDocSchema.parse({
    uid,
    email: authUser?.email ?? '',
    displayName: authUser?.displayName ?? null,
    tier: 'free',
    generationsUsed: 0,
    createdAt: now,
    updatedAt: now,
  });

  await ref.set(doc);
}

export async function getUserDoc(uid: string) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
}
