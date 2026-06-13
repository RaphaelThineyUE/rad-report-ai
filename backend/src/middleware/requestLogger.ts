/**
 * Access-log middleware, mounted first in app.ts so it covers every route.
 * Emits one structured JSON line per request (method, path, status, duration_ms)
 * to stdout/stderr on response finish, so requests are visible in Vercel's
 * runtime function logs. Does not forward to Sentry — error events are already
 * captured by errorHandler via the structured logger.
 */
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    };

    const write = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
    write(JSON.stringify(entry));
  });

  next();
}
