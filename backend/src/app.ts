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
// CORS configuration: allow all origins in staging, localhost in dev
const corsOrigin = process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL
  : true; // Allow all in staging and dev for now

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(sentryErrorHandler());
app.use(errorHandler);

export default app;
