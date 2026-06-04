import cors from 'cors';
import express from 'express';
import { aiRouter } from './routes/aiRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { patientRouter } from './routes/patientRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { treatmentRouter } from './routes/treatmentRoutes.js';
import { env } from './utils/env.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/reports', reportRouter);
app.use('/api/treatments', treatmentRouter);
app.use('/api/ai', aiRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof Error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(env.PORT, () => {
  console.log(`RadReport AI backend listening on http://localhost:${env.PORT}`);
});
