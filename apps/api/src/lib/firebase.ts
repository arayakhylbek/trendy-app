import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _app: App | null = null;

function getApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0]!;
    return _app;
  }

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials not configured. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.'
    );
  }

  _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return _app;
}

// Lazy proxy — throws with a clear message only when actually used
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getFirestore(getApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getAuth(getApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
