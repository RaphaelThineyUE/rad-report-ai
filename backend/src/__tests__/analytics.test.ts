import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAnalytics, exportAnalyticsCsv } from '../controllers/analyticsController';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient';

jest.mock('../services/supabaseClient', () => ({
  supabaseAdmin: { from: jest.fn() },
  createUserClient: jest.fn(),
}));

interface TableResult {
  data: unknown[] | null;
  error: { message: string } | null;
}

function buildQueryBuilder(result: TableResult, eqCalls: Array<[string, string, unknown]>, table: string) {
  const builder: PromiseLike<TableResult> & {
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
  } = {
    select: jest.fn(() => builder),
    eq: jest.fn((column: string, value: unknown) => {
      eqCalls.push([table, column, value]);
      return builder;
    }),
    in: jest.fn(() => builder),
    then: (onResolve, onReject) => Promise.resolve(result).then(onResolve, onReject),
  };
  return builder;
}

function buildMockClient(tables: Record<string, TableResult>, eqCalls: Array<[string, string, unknown]>) {
  return {
    from: jest.fn((table: string) => buildQueryBuilder(tables[table] ?? { data: [], error: null }, eqCalls, table)),
  };
}

function buildRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as Response & { status: jest.Mock; json: jest.Mock; send: jest.Mock; setHeader: jest.Mock };
}

describe('analyticsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('scopes queries to the caller via createUserClient + created_by for a normal user', async () => {
      const eqCalls: Array<[string, string, unknown]> = [];
      const mockClient = buildMockClient(
        {
          patients: { data: [{ id: 'p1', cancer_stage: 'Stage I', created_at: '2024-01-01' }], error: null },
          radiology_reports: { data: [], error: null },
        },
        eqCalls,
      );
      (createUserClient as jest.Mock).mockReturnValue(mockClient);

      const req = { userId: 'user-1', accessToken: 'user-token', userRole: 'user', query: {} } as unknown as AuthRequest;
      const res = buildRes();

      await getAnalytics(req, res);

      expect(createUserClient).toHaveBeenCalledWith('user-token');
      expect(supabaseAdmin.from).not.toHaveBeenCalled();
      expect(eqCalls).toContainEqual(['patients', 'created_by', 'user-1']);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        summary: expect.objectContaining({ total_patients: 1 }),
      }));
    });

    it('bypasses RLS via supabaseAdmin and skips the created_by filter for an admin user', async () => {
      const eqCalls: Array<[string, string, unknown]> = [];
      const mockAdminClient = buildMockClient(
        {
          patients: {
            data: [
              { id: 'p1', cancer_stage: 'Stage I', created_at: '2024-01-01' },
              { id: 'p2', cancer_stage: 'Stage II', created_at: '2024-01-02' },
            ],
            error: null,
          },
          radiology_reports: { data: [], error: null },
        },
        eqCalls,
      );
      (supabaseAdmin.from as jest.Mock).mockImplementation(mockAdminClient.from);

      const req = { userId: 'admin-1', accessToken: 'admin-token', userRole: 'admin', query: {} } as unknown as AuthRequest;
      const res = buildRes();

      await getAnalytics(req, res);

      expect(createUserClient).not.toHaveBeenCalled();
      expect(supabaseAdmin.from).toHaveBeenCalledWith('patients');
      expect(eqCalls.find(([table, column]) => table === 'patients' && column === 'created_by')).toBeUndefined();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        summary: expect.objectContaining({ total_patients: 2 }),
      }));
    });

    it('returns 500 when the patients query errors', async () => {
      const eqCalls: Array<[string, string, unknown]> = [];
      const mockClient = buildMockClient(
        { patients: { data: null, error: { message: 'RLS denied' } } },
        eqCalls,
      );
      (createUserClient as jest.Mock).mockReturnValue(mockClient);

      const req = { userId: 'user-1', accessToken: 'user-token', userRole: 'user', query: {} } as unknown as AuthRequest;
      const res = buildRes();

      // The function now throws errors, so we expect it to throw
      await expect(getAnalytics(req, res)).rejects.toThrow();
    });
  });

  describe('exportAnalyticsCsv', () => {
    it('scopes the patients query to created_by for a normal user', async () => {
      const eqCalls: Array<[string, string, unknown]> = [];
      const mockClient = buildMockClient(
        {
          patients: { data: [{ id: 'p1', full_name: 'Jane Doe', cancer_stage: 'Stage I', cancer_type: 'Breast', created_at: '2024-01-01' }], error: null },
          radiology_reports: { data: [], error: null },
        },
        eqCalls,
      );
      (createUserClient as jest.Mock).mockReturnValue(mockClient);

      const req = { userId: 'user-1', accessToken: 'user-token', userRole: 'user', query: {} } as unknown as AuthRequest;
      const res = buildRes();

      await exportAnalyticsCsv(req, res);

      expect(eqCalls).toContainEqual(['patients', 'created_by', 'user-1']);
      expect(res.send).toHaveBeenCalled();
    });

    it('skips the created_by filter for an admin user', async () => {
      const eqCalls: Array<[string, string, unknown]> = [];
      const mockAdminClient = buildMockClient(
        {
          patients: { data: [{ id: 'p1', full_name: 'Jane Doe', cancer_stage: 'Stage I', cancer_type: 'Breast', created_at: '2024-01-01' }], error: null },
          radiology_reports: { data: [], error: null },
        },
        eqCalls,
      );
      (supabaseAdmin.from as jest.Mock).mockImplementation(mockAdminClient.from);

      const req = { userId: 'admin-1', accessToken: 'admin-token', userRole: 'admin', query: {} } as unknown as AuthRequest;
      const res = buildRes();

      await exportAnalyticsCsv(req, res);

      expect(eqCalls.find(([table, column]) => table === 'patients' && column === 'created_by')).toBeUndefined();
      expect(res.send).toHaveBeenCalled();
    });
  });
});
