import request from 'supertest';
import express from 'express';
import { requestLogger } from '../middleware/requestLogger';

function buildApp() {
  const app = express();
  app.use(requestLogger);
  app.get('/ok', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/missing', (_req, res) => res.status(404).json({ error: 'not found' }));
  app.get('/boom', (_req, res) => res.status(500).json({ error: 'boom' }));
  return app;
}

describe('requestLogger', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs successful requests via console.log at info level', async () => {
    await request(buildApp()).get('/ok').expect(200);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'info', method: 'GET', path: '/ok', status: 200 });
    expect(typeof entry.duration_ms).toBe('number');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs 4xx responses via console.warn at warn level', async () => {
    await request(buildApp()).get('/missing').expect(404);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(warnSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'warn', method: 'GET', path: '/missing', status: 404 });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs 5xx responses via console.error at error level', async () => {
    await request(buildApp()).get('/boom').expect(500);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'error', method: 'GET', path: '/boom', status: 500 });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
