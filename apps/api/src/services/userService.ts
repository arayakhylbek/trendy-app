import { db } from '../lib/firebase.js';

interface AuthUserInfo {
  email?: string;
  displayName?: string | null;
}

// Every new user is created on the free tier with 0 used → 2 free generations
// (PLANS.free.monthlyLimit). Built as a plain object, NOT via UserDocSchema.parse,
// because the schema's strict email() check would throw for providers without an
// email and silently leave the user with no doc (→ 404 → "0 generations").
export async function ensureUser(uid: string, authUser?: AuthUserInfo): Promise<void> {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;

  const now = new Date().toISOString();
  const email =
    authUser?.email && authUser.email.includes('@') ? authUser.email : `${uid}@users.trendy.local`;

  await ref.set({
    uid,
    email,
    displayName: authUser?.displayName ?? null,
    tier: 'free',
    generationsUsed: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getUserDoc(uid: string) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
}
