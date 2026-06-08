import 'dotenv/config';
import { validateEnv } from './utils/validateEnv.js';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './utils/sentry.js';

validateEnv();
initSentry();

import express, { Express } from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Express = express();

app.use(sentryRequestHandler());
// In development allow any localhost port (Vite may pick a different port if 5173 is busy).
// In production lock to the configured FRONTEND_URL.
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL ?? 'http://localhost:5173'
    : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) =>
        cb(null, !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin));

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(sentryErrorHandler());
app.use(errorHandler);

export default app;
