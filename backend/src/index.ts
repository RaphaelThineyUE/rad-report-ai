import 'dotenv/config';
import { validateEnv } from './utils/validateEnv';
validateEnv();

import express, { Express } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
