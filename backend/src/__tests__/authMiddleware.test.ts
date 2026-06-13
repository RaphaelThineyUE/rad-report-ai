import { Response, NextFunction } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabaseClient';

jest.mock('../services/supabaseClient', () => ({
  supabaseAdmin: { auth: { getUser: jest.fn() } },
}));

function buildReq(token?: string): AuthRequest {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as AuthRequest;
}

function buildRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock };
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('rejects requests without a bearer token', async () => {
      const req = buildReq();
      const res = buildRes();
      const next = jest.fn();

      await requireAuth(req, res, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('attaches userRole "user" when app_metadata has no admin role', async () => {
      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', app_metadata: {} } },
        error: null,
      });

      const req = buildReq('valid-token');
      const res = buildRes();
      const next = jest.fn();

      await requireAuth(req, res, next as NextFunction);

      expect(req.userId).toBe('user-1');
      expect(req.userRole).toBe('user');
      expect(next).toHaveBeenCalled();
    });

    it('attaches userRole "admin" when app_metadata.role is admin', async () => {
      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
        error: null,
      });

      const req = buildReq('valid-token');
      const res = buildRes();
      const next = jest.fn();

      await requireAuth(req, res, next as NextFunction);

      expect(req.userRole).toBe('admin');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('returns 403 for a non-admin user', async () => {
      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', app_metadata: {} } },
        error: null,
      });

      const req = buildReq('valid-token');
      const res = buildRes();
      const next = jest.fn();

      await requireAdmin(req, res, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next for an admin user', async () => {
      (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
        error: null,
      });

      const req = buildReq('valid-token');
      const res = buildRes();
      const next = jest.fn();

      await requireAdmin(req, res, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
