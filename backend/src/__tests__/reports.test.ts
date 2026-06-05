import request from 'supertest';
import express from 'express';

describe('Reports API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
  });

  describe('POST /api/reports', () => {
    it('should validate patient_id is UUID', async () => {
      const response = await request(app)
        .post('/api/reports')
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
