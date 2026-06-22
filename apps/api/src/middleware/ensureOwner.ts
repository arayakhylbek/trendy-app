import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase.js';
import { UnauthorizedError } from '@trendy/shared';

const OWNER_EMAIL = 'araiakhylbek78@gmail.com';

export async function ensureOwner(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing token'));
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    if (decoded.email?.toLowerCase() !== OWNER_EMAIL) {
      return next(new UnauthorizedError('Owner only'));
    }
    req.uid = decoded.uid;
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}
