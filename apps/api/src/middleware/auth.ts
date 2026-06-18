import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase.js';
import { UnauthorizedError } from '@trendy/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid: string;
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
    next();
  } catch (e) {
    if (e instanceof Error && e.message.includes('Firebase Admin credentials not configured')) {
      next(new UnauthorizedError('Server not configured: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required'));
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}
