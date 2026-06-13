/**
 * Global Express error-handling middleware, registered last in app.ts.
 * Standardizes all error responses to: { error: { code, message, details? } }
 * Handles AppError (structured errors), Multer errors, and generic errors.
 * Logs errors via the structured logger; never leaks stack traces to the client.
 */
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.error(`AppError [${err.code}]`, { message: err.message, details: err.details });
    const errorResponse: Record<string, unknown> = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      errorResponse.details = err.details;
    }
    res.status(err.statusCode).json({
      error: errorResponse,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Uploaded file exceeds maximum allowed size',
        },
      });
      return;
    }
    res.status(422).json({
      error: {
        code: 'INVALID_UPLOAD',
        message: 'Invalid upload payload',
      },
    });
    return;
  }

  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}
