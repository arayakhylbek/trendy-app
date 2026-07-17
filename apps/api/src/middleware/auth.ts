import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase.js';
import { UnauthorizedError, AppError } from '@trendy/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid: string;
      emailVerified: boolean;
      signInProvider: string;
    }
  }
}

export async function ensureAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    req.uid = decoded.uid;
    req.emailVerified = decoded.email_verified === true;
    req.signInProvider = (decoded.firebase?.sign_in_provider as string | undefined) ?? 'password';
    next();
  } catch (e) {
    if (e instanceof Error && e.message.includes('Firebase Admin credentials not configured')) {
      next(new UnauthorizedError('Server not configured: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required'));
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

// Gate valuable actions behind a verified email. Google sign-in always has
// email_verified=true, so this only stops unverified email/password signups.
// Must run after ensureAuth.
export function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  if (req.emailVerified) return next();
  next(
    new AppError(
      'EMAIL_NOT_VERIFIED',
      'Please verify your email — we sent you a confirmation link. Check your inbox, then try again.',
      403,
    ),
  );
}
