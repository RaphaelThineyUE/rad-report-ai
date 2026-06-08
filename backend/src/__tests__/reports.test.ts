import request from 'supertest';
import express from 'express';

jest.mock('../services/supabaseClient', () => ({
  supabaseAdmin: {
    storage: { from: jest.fn() },
  },
  createUserClient: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    req.userId = 'test-user-id';
    req.accessToken = req.headers.authorization.slice(7);
    next();
  },
}));

jest.mock('../controllers/reportController', () => {
  const { validationResult } = require('express-validator');
  return {
    createReport: async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      res.status(201).json({ id: 'new-report' });
    },
    listReports: async (_req: any, res: any) => res.json([]),
    getReport: async (_req: any, res: any) => res.json({}),
    updateReport: async (_req: any, res: any) => res.json({}),
    deleteReport: async (_req: any, res: any) => res.status(204).send(),
    getReportSignedUrl: async (_req: any, res: any) => res.json({ url: 'https://example.com' }),
    uploadReport: async (_req: any, res: any) => res.status(201).json({}),
    batchUploadReports: async (_req: any, res: any) => res.status(201).json([]),
    processReport: async (_req: any, res: any) => res.json({}),
    exportReportJson: async (_req: any, res: any) => res.json({}),
  };
});

// eslint-disable-next-line import/first
import reportsRouter from '../routes/reports';
import { errorHandler } from '../middleware/errorHandler';

describe('Reports API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/reports', reportsRouter);
    app.use(errorHandler);
  });

  describe('POST /api/reports', () => {
    it('should validate patient_id is UUID', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer test-token')
        .send({
          patient_id: 'not-a-uuid',
          filename: 'report.pdf',
          file_url: 'https://example.com/report.pdf',
          file_size: 1024,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate filename is required', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer test-token')
        .send({
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          file_url: 'https://example.com/report.pdf',
          file_size: 1024,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate file_url is required', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer test-token')
        .send({
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          filename: 'report.pdf',
          file_size: 1024,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate file_size is positive integer', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer test-token')
        .send({
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          filename: 'report.pdf',
          file_url: 'https://example.com/report.pdf',
          file_size: 0,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate file_size is not negative', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer test-token')
        .send({
          patient_id: '550e8400-e29b-41d4-a716-446655440000',
          filename: 'report.pdf',
          file_url: 'https://example.com/report.pdf',
          file_size: -1024,
        })
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/reports/:id/process', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reports/550e8400-e29b-41d4-a716-446655440000/process')
        .send({});

      // Should fail without auth token
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/reports/:id/url', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/550e8400-e29b-41d4-a716-446655440000/url');

      // Should fail without auth token
      expect([401, 403]).toContain(response.status);
    });
  });
});
