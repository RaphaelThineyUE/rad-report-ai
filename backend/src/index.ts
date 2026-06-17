import app from './app.js';
import { startInlineReportProcessingWorker } from './workers/reportProcessingWorker.js';

const PORT = process.env.PORT ?? 3001;
const worker = startInlineReportProcessingWorker();
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

function shutdown() {
  worker?.stop();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
