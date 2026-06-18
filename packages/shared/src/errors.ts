export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') {
    super('UNAUTHORIZED', msg, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') {
    super('FORBIDDEN', msg, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(msg: string) {
    super('VALIDATION_ERROR', msg, 400);
  }
}

export class QuotaExceededError extends AppError {
  constructor() {
    super('QUOTA_EXCEEDED', 'Monthly generation limit reached. Upgrade your plan to continue.', 429);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMITED', 'Too many requests. Please slow down.', 429);
  }
}
