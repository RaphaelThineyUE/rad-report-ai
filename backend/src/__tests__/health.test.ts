import request from 'supertest';
import express from 'express';
import healthRouter from '../routes/health';

function buildApp() {
  const app = express();
  app.use('/api/health', healthRouter);
  return app;
}

describe('GET /api/health', () => {
  it('returns status ok with version and timestamp', async () => {
    const res = await request(buildApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.version).toBe('string');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
