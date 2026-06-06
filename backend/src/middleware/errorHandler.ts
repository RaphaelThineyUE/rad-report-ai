/**
 * Global Express error-handling middleware, registered last in index.ts.
 * Exports `errorHandler` — handles Multer file-size/upload errors with specific
 * HTTP status codes (413/422) and falls back to 500 for all other unhandled errors.
 * Logs errors via the structured logger; never leaks stack traces to the client.
 */
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'Uploaded file exceeds maximum allowed size' });
      return;
    }
    res.status(422).json({ error: 'Invalid upload payload' });
    return;
  }

  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({ error: 'Internal server error' });
}
