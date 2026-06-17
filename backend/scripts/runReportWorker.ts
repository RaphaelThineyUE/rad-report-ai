import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { startReportWorker } from '../src/services/reportProcessingService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

startReportWorker();

process.stdin.resume();
