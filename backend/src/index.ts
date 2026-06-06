/**
 * Express application entry point for the rad-report-ai backend.
 * Bootstraps the server: validates env, initialises Sentry, mounts CORS/JSON middleware,
 * registers all API routes under /api, attaches the global error handler, and starts
 * listening on PORT (default 3001). Exports `app` for testing.
 */
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
const PORT = process.env.PORT ?? 3001;

app.use(sentryRequestHandler());

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(sentryErrorHandler());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
