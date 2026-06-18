import type { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '@trendy/shared';

interface HitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, HitEntry>();

export function rateLimit(maxPerMinute: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.uid ?? (req.ip ?? 'unknown');
    const now = Date.now();
    const entry = store.get(key) ?? { count: 0, resetAt: now + 60_000 };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 60_000;
    }
    entry.count++;
    store.set(key, entry);

    if (entry.count > maxPerMinute) {
      return next(new RateLimitError());
    }
    next();
  };
}
