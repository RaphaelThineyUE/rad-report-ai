/**
 * Unauthenticated health check, mounted at /api/health (unlike the root /health route,
 * which Vercel's SPA rewrite intercepts in production before it reaches this API).
 */
import { IRouter, Router } from 'express';

const router: IRouter = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev',
    timestamp: new Date().toISOString(),
  });
});

export default router;
