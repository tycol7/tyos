/**
 * Error handling middleware and custom error classes
 */

import type { Context } from 'hono';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof NotFoundError) {
    return c.json(
      {
        error: {
          message: err.message,
          code: 'NOT_FOUND',
        },
      },
      404
    );
  }

  if (err instanceof ValidationError) {
    return c.json(
      {
        error: {
          message: err.message,
          code: 'VALIDATION_ERROR',
        },
      },
      400
    );
  }

  if (err instanceof UploadError) {
    return c.json(
      {
        error: {
          message: err.message,
          code: 'UPLOAD_FAILED',
        },
      },
      500
    );
  }

  // Generic server error
  return c.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    500
  );
}
