import { logger } from '../utils/logger.js';
import { startReportWorker } from '../services/reportProcessingService.js';

export function startInlineReportProcessingWorker(): { stop: () => void } | null {
  if (process.env.REPORT_WORKER_INLINE === 'false') {
    logger.info('Inline report worker disabled');
    return null;
  }

  const worker = startReportWorker();
  logger.info('Inline report worker started');
  return worker;
}
