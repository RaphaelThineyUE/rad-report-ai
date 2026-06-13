/**
 * Express authentication middleware for the backend API.
 * Exports `requireAuth` — validates the Bearer JWT from the Authorization header
 * via Supabase Admin, then attaches `userId`, `accessToken`, and `userRole` to the request.
 * The admin role is read from `app_metadata.role` (settable only via the service-role
 * Admin API, so users cannot self-elevate by editing their own user_metadata).
 * Exports `requireAdmin`, which additionally requires `userRole === 'admin'`.
 * Exports the `AuthRequest` interface that extends Express Request with those fields.
 * Routes that call this middleware can safely cast req to AuthRequest.
 */
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';

export interface AuthRequest extends Request {
  userId: string;
  accessToken: string;
  userRole: 'admin' | 'user';
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = header.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as AuthRequest).userId = data.user.id;
  (req as AuthRequest).accessToken = token;
  (req as AuthRequest).userRole = data.user.app_metadata?.role === 'admin' ? 'admin' : 'user';
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, () => {
    if ((req as AuthRequest).userRole !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}
