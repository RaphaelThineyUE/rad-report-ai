/**
 * Structured error class for standardized API error responses.
 * All API errors should throw instances of AppError so the error handler
 * middleware can normalize them to: { error: { code, message, details } }
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Common error factory functions for consistency
export const Errors = {
  validation: (message: string, details?: unknown) =>
    new AppError('VALIDATION_ERROR', message, 422, details),

  notFound: (resource: string) =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),

  unauthorized: () =>
    new AppError('UNAUTHORIZED', 'Unauthorized', 401),

  forbidden: () =>
    new AppError('FORBIDDEN', 'Forbidden', 403),

  conflict: (message: string) =>
    new AppError('CONFLICT', message, 409),

  fileError: (message: string, code?: string) =>
    new AppError(code || 'FILE_ERROR', message, 422),

  internal: (message: string) =>
    new AppError('INTERNAL_ERROR', message, 500),
};
