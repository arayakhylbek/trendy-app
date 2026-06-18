import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@trendy/shared';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  logger.error(err, 'Unhandled error');
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' },
  });
}
