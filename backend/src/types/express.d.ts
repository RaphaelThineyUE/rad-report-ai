import type { UserRecord } from '../models/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<UserRecord, 'id' | 'email' | 'role' | 'full_name'>;
    }
  }
}

export {};
