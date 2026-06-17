import os from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  analyzeReport,
  cleanupIdentifiers,
  detectBiradsTrend,
  generateSummary,
} from './claudeService.js';
import {
  extractTextFromPdf,
  isValidPdf,
  type PdfExtractionStage,
} from './pdfService.js';
import { supabaseAdmin } from './supabaseClient.js';
import { logger } from '../utils/logger.js';

export type ReportProcessingStage =
  | 'queued'
  | 'downloading'
  | 'validating_pdf'
  | 'extracting_text'
  | 'preprocessing_images'
  | 'running_ocr'
  | 'deidentifying'
  | 'analyzing'
  | 'saving_results'
  | 'completed'
  | 'failed';

type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

type ClaimedJobRow = {
  job_id: string;
  report_id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  attempts: number;
};

type ReportRow = {
  id: string;
  created_by: string;
  patient_id: string;
  filename: string;
  file_url: string | null;
  birads_value: number | null;
  created_at: string;
};

const DEFAULT_JOB_MAX_ATTEMPTS = 3;
const DEFAULT_WORKER_POLL_MS = Number(process.env.REPORT_WORKER_POLL_MS ?? 2000);
const DEFAULT_WORKER_LEASE_SECONDS = Number(process.env.REPORT_WORKER_LEASE_SECONDS ?? 900);

const STAGE_PROGRESS: Record<ReportProcessingStage, number> = {
  queued: 0,
  downloading: 10,
  validating_pdf: 20,
  extracting_text: 35,
  preprocessing_images: 45,
  running_ocr: 55,
  deidentifying: 70,
  analyzing: 82,
  saving_results: 94,
  completed: 100,
  failed: 0,
};

const PDF_STAGE_TO_REPORT_STAGE: Record<PdfExtractionStage, ReportProcessingStage> = {
  extracting_text: 'extracting_text',
  preprocessing_images: 'preprocessing_images',
  running_ocr: 'running_ocr',
};

function nowIso(): string {
  return new Date().toISOString();
}

function compactUpdates(updates: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
}

export function buildReportStoragePath(
  userId: string,
  patientId: string,
  filename: string,
  at: Date = new Date()
): string {
  const year = String(at.getUTCFullYear());
  const month = String(at.getUTCMonth() + 1).padStart(2, '0');
  const day = String(at.getUTCDate()).padStart(2, '0');
  const safeName = filename.replace(/[^\w.-]+/g, '_');
  return `${userId}/${patientId}/${year}/${month}/${day}/${Date.now()}-${safeName}`;
}

async function updateReportState(
  reportId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('radiology_reports')
    .update({
      ...compactUpdates(updates),
      updated_at: nowIso(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to update report state: ${error.message}`);
  }
}

async function updateJobStateById(
  jobId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('report_processing_jobs')
    .update({
      ...compactUpdates(updates),
      updated_at: nowIso(),
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update job state: ${error.message}`);
  }
}

async function updateStage(
  reportId: string,
  jobId: string,
  stage: ReportProcessingStage,
  status: ReportStatus = 'processing'
): Promise<void> {
  const progress = STAGE_PROGRESS[stage];
  const stageStamp = nowIso();

  await Promise.all([
    updateReportState(reportId, {
      status,
      processing_stage: stage,
      processing_progress: progress,
      completed_at: stage === 'completed' ? stageStamp : stage === 'failed' ? stageStamp : null,
      last_error: stage === 'failed' ? undefined : null,
    }),
    updateJobStateById(jobId, {
      status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : 'processing',
      stage,
      progress,
      lease_expires_at: new Date(Date.now() + DEFAULT_WORKER_LEASE_SECONDS * 1000).toISOString(),
      completed_at: stage === 'completed' ? stageStamp : stage === 'failed' ? stageStamp : null,
      last_error: stage === 'failed' ? undefined : null,
    }),
  ]);
}

export async function enqueueReportProcessing(reportId: string): Promise<void> {
  const timestamp = nowIso();
  const { data: existingJob, error: existingError } = await supabaseAdmin
    .from('report_processing_jobs')
    .select('id')
    .eq('report_id', reportId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to inspect report job: ${existingError.message}`);
  }

  if (existingJob) {
    const { error: updateError } = await supabaseAdmin
      .from('report_processing_jobs')
      .update({
        status: 'queued',
        stage: 'queued',
        progress: 0,
        attempts: 0,
        worker_id: null,
        lease_expires_at: null,
        completed_at: null,
        last_error: null,
        updated_at: timestamp,
      })
      .eq('id', existingJob.id);

    if (updateError) {
      throw new Error(`Failed to requeue report job: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('report_processing_jobs')
      .insert({
        report_id: reportId,
        status: 'queued',
        stage: 'queued',
        progress: 0,
        attempts: 0,
        max_attempts: DEFAULT_JOB_MAX_ATTEMPTS,
        created_at: timestamp,
        updated_at: timestamp,
      });

    if (insertError) {
      throw new Error(`Failed to create report job: ${insertError.message}`);
    }
  }

  await updateReportState(reportId, {
    status: 'pending',
    processing_stage: 'queued',
    processing_progress: 0,
    queued_at: timestamp,
    started_at: null,
    completed_at: null,
    last_error: null,
  });
}

export async function claimNextReportProcessingJob(
  workerId: string,
  leaseSeconds: number = DEFAULT_WORKER_LEASE_SECONDS
): Promise<ClaimedJobRow | null> {
  const { data, error } = await supabaseAdmin.rpc('claim_next_report_processing_job', {
    p_worker_id: workerId,
    p_lease_seconds: leaseSeconds,
  });

  if (error) {
    throw new Error(`Failed to claim report job: ${error.message}`);
  }

  const claimed = (data as ClaimedJobRow[] | null)?.[0] ?? null;
  if (!claimed) {
    return null;
  }

  await updateReportState(claimed.report_id, {
    status: 'processing',
    processing_stage: 'downloading',
    processing_progress: STAGE_PROGRESS.downloading,
    started_at: nowIso(),
    last_error: null,
  });

  return claimed;
}

async function getReportForProcessing(reportId: string): Promise<ReportRow> {
  const { data, error } = await supabaseAdmin
    .from('radiology_reports')
    .select('id, created_by, patient_id, filename, file_url, birads_value, created_at')
    .eq('id', reportId)
    .single();

  if (error || !data) {
    throw new Error('Report not found');
  }

  return data as ReportRow;
}

export async function processReportJob(reportId: string, jobId: string): Promise<void> {
  const startTime = Date.now();

  try {
    const report = await getReportForProcessing(reportId);

    if (!report.file_url) {
      throw new Error('Report file URL is missing');
    }

    await updateStage(reportId, jobId, 'downloading');

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(process.env.STORAGE_BUCKET ?? 'reports')
      .download(report.file_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download report file: ${downloadError?.message ?? 'missing blob'}`);
    }

    await updateStage(reportId, jobId, 'validating_pdf');

    const valid = await isValidPdf(fileData);
    if (!valid) {
      throw new Error('Invalid PDF file');
    }

    await updateStage(reportId, jobId, 'extracting_text');

    let extractedText = await extractTextFromPdf(fileData, {
      onStage: async (pdfStage) => {
        await updateStage(reportId, jobId, PDF_STAGE_TO_REPORT_STAGE[pdfStage]);
      },
    });
    const rawText = extractedText;

    await updateStage(reportId, jobId, 'deidentifying');
    extractedText = await cleanupIdentifiers(extractedText);

    await updateStage(reportId, jobId, 'analyzing');
    const analysis = await analyzeReport(extractedText);

    let summary = analysis.summary;
    if (!summary) {
      const summaryResult = await generateSummary(extractedText);
      summary = summaryResult.summary;
    }

    let biradsTrend = null;
    if (analysis.birads_value && report.birads_value) {
      biradsTrend = await detectBiradsTrend([
        { value: report.birads_value, date: report.created_at },
        { value: analysis.birads_value, date: new Date().toISOString() },
      ]);
    }

    await updateStage(reportId, jobId, 'saving_results');

    const processingTime = Date.now() - startTime;
    const completedAt = nowIso();

    await updateReportState(reportId, {
      status: 'completed',
      processing_stage: 'completed',
      processing_progress: 100,
      summary,
      exam_date: analysis.exam_date,
      modality: analysis.modality,
      contrast: analysis.contrast,
      birads_value: analysis.birads_value,
      birads_confidence: analysis.birads_confidence,
      birads_evidence: analysis.findings.map((finding) => finding.assessment),
      breast_density_value: analysis.breast_density_value,
      breast_density_evidence: [analysis.breast_density_value],
      exam_type: analysis.exam_type,
      exam_laterality: analysis.exam_laterality,
      exam_evidence: [analysis.exam_type, analysis.exam_laterality],
      clinical_history: analysis.clinical_history,
      risk_factors: analysis.risk_factors,
      comparison_prior_exam_date: analysis.prior_exam_date,
      comparison_dates: analysis.comparison_dates,
      comparison_evidence: analysis.prior_exam_date ? [analysis.prior_exam_date] : [],
      findings: analysis.findings,
      lymph_nodes: analysis.lymph_nodes,
      skin_nipple_changes: analysis.skin_nipple_changes,
      implants: analysis.implants,
      post_surgical_changes: analysis.post_surgical_changes,
      multifocal: analysis.multifocal,
      multicentric: analysis.multicentric,
      bilateral_disease: analysis.bilateral_disease,
      disease_extent: analysis.disease_extent,
      recommendations: analysis.recommendations,
      management: analysis.management,
      pathology_correlation: analysis.pathology_correlation,
      red_flags: analysis.red_flags,
      processing_time_ms: processingTime,
      raw_text: rawText,
      analysis_json: {
        ...JSON.parse(analysis.raw_analysis),
        birads_trend: biradsTrend,
      },
      completed_at: completedAt,
      last_error: null,
    });

    await updateJobStateById(jobId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      completed_at: completedAt,
      lease_expires_at: null,
      last_error: null,
    });

    logger.info('Report job completed', {
      reportId,
      jobId,
      processingTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const failedAt = nowIso();

    await Promise.allSettled([
      updateReportState(reportId, {
        status: 'failed',
        processing_stage: 'failed',
        processing_progress: 0,
        processing_time_ms: Date.now() - startTime,
        completed_at: failedAt,
        last_error: message,
      }),
      updateJobStateById(jobId, {
        status: 'failed',
        stage: 'failed',
        progress: 0,
        completed_at: failedAt,
        lease_expires_at: null,
        last_error: message,
      }),
    ]);

    logger.error('Report job failed', {
      reportId,
      jobId,
      error: message,
    });
  }
}

export async function processNextReportJob(workerId: string): Promise<boolean> {
  const claimed = await claimNextReportProcessingJob(workerId);
  if (!claimed) {
    return false;
  }

  await processReportJob(claimed.report_id, claimed.job_id);
  return true;
}

export function createReportWorkerId(): string {
  return `${os.hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
}

export function startReportWorker(options?: {
  workerId?: string;
  pollIntervalMs?: number;
}): { stop: () => void } {
  const workerId = options?.workerId ?? createReportWorkerId();
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_WORKER_POLL_MS;
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    if (stopped) {
      return;
    }

    try {
      const processed = await processNextReportJob(workerId);
      timer = setTimeout(tick, processed ? 50 : pollIntervalMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Report worker tick failed', { workerId, error: message });
      timer = setTimeout(tick, pollIntervalMs);
    }
  };

  timer = setTimeout(tick, 0);

  return {
    stop: () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
