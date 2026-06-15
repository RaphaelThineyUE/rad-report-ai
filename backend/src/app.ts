import 'dotenv/config';
import { validateEnv } from './utils/validateEnv.js';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './utils/sentry.js';

validateEnv();
initSentry();

import express, { Express } from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app: Express = express();

app.use(requestLogger);
app.use(sentryRequestHandler());
// If FRONTEND_URL is configured (staging/production), use it.
// Otherwise allow localhost for development (any port, since Vite may pick a different port).
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) =>
      cb(null, !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin));

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(sentryErrorHandler());
app.use(errorHandler);

export default app;
