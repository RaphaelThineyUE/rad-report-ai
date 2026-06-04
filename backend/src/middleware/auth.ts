import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../utils/env.js';

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const header = request.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Missing bearer token.' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: 'admin' | 'user';
      full_name?: string | null;
    };

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name ?? null,
    };

    next();
  } catch {
    response.status(401).json({ error: 'Invalid token.' });
  }
};
