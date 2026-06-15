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
// Allow requests from configured FRONTEND_URL (for staging/production),
// or from localhost (for development).
const corsOrigin = (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
  const allowed =
    !origin || // allow requests with no origin (e.g., Postman, mobile apps)
    /^https?:\/\/localhost(:\d+)?$/.test(origin) || // allow localhost in dev
    origin === process.env.FRONTEND_URL; // allow configured frontend URL
  cb(null, allowed);
};

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(sentryErrorHandler());
app.use(errorHandler);

export default app;
