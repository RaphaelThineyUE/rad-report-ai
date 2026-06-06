/**
 * Rate-limiting middleware for the backend API.
 * Exports `authRateLimiter` — restricts callers to 20 requests per 15-minute window,
 * intended for auth-adjacent routes (login, token refresh) to mitigate brute-force
 * attacks. Uses standard RateLimit response headers; no legacy X-RateLimit headers.
 */
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
