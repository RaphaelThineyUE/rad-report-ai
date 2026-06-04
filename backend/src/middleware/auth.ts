import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';

export interface AuthRequest extends Request {
  userId: string;
  accessToken: string;
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
  next();
}
