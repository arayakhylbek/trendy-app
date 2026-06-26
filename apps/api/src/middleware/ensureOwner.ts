import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase.js';
import { UnauthorizedError } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

export async function ensureOwner(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing token'));
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    if (!ADMIN_EMAILS.includes(decoded.email?.toLowerCase() ?? '')) {
      return next(new UnauthorizedError('Owner only'));
    }
    req.uid = decoded.uid;
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}
