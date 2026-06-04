import jwt from 'jsonwebtoken';
import { env } from './env.js';
import type { UserRecord } from '../models/types.js';

export const signToken = (user: Pick<UserRecord, 'id' | 'email' | 'role' | 'full_name'>) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
