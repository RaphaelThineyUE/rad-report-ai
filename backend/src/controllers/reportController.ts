/**
 * Report controller — PDF upload, storage, background processing, and export for radiology reports.
 * Exports: uploadReport, batchUploadReports (≤50 files), createReport, listReports,
 *   getReport, updateReport, deleteReport, getReportSignedUrl, exportReportJson, processReport.
 * supabaseAdmin is used for storage operations (upload, download, signed URL, delete);
 * caller's JWT client is used for DB queries so RLS enforces ownership.
 * Heavy OCR/AI work runs in background worker after report is queued.
 */
import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import {
  buildReportStoragePath,
  enqueueReportProcessing,
} from '../services/reportProcessingService.js';
import { AppError, Errors } from '../utils/AppError.js';
import { logReportAudit } from '../services/auditService.js';

const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? 'reports';

interface CreateReportBody {
  patient_id: string;
  filename: string;
  file_url: string;
  file_size: number;
}

type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ReportUpdateBody {
  status?: ReportStatus;
  summary?: string | null;
  exam_date?: string | null;
  modality?: string | null;
  contrast?: string | null;
  birads_value?: number | null;
  birads_confidence?: 'low' | 'medium' | 'high' | null;
  birads_evidence?: unknown;
  breast_density_value?: string | null;
  breast_density_evidence?: unknown;
  exam_type?: string | null;
  exam_laterality?: string | null;
  exam_evidence?: unknown;
  clinical_history?: string | null;
  risk_factors?: unknown;
  comparison_prior_exam_date?: string | null;
  comparison_dates?: unknown;
  comparison_evidence?: unknown;
  findings?: unknown;
  lymph_nodes?: unknown;
  skin_nipple_changes?: unknown;
  implants?: unknown;
  post_surgical_changes?: unknown;
  multifocal?: boolean | null;
  multicentric?: boolean | null;
  bilateral_disease?: boolean | null;
  disease_extent?: string | null;
  recommendations?: unknown;
  management?: unknown;
  pathology_correlation?: string | null;
  red_flags?: unknown;
  processing_time_ms?: number | null;
  raw_text?: string | null;
  analysis_json?: unknown;
}

const REPORT_UPDATE_FIELDS: (keyof ReportUpdateBody)[] = [
  'status',
  'summary',
  'exam_date',
  'modality',
  'contrast',
  'birads_value',
  'birads_confidence',
  'birads_evidence',
  'breast_density_value',
  'breast_density_evidence',
  'exam_type',
  'exam_laterality',
  'exam_evidence',
  'clinical_history',
  'risk_factors',
  'comparison_prior_exam_date',
  'comparison_dates',
  'comparison_evidence',
  'findings',
  'lymph_nodes',
  'skin_nipple_changes',
  'implants',
  'post_surgical_changes',
  'multifocal',
  'multicentric',
  'bilateral_disease',
  'disease_extent',
  'recommendations',
  'management',
  'pathology_correlation',
  'red_flags',
  'processing_time_ms',
  'raw_text',
  'analysis_json',
];

export async function uploadReport(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    throw Errors.fileError('Missing file');
  }

  if (req.file.mimetype !== 'application/pdf') {
    throw Errors.fileError('Only PDF uploads are supported');
  }

  const patientId = String(req.body.patient_id ?? '').trim();
  if (!patientId) {
    throw Errors.validation('patient_id is required');
  }

  const filename = req.file.originalname;
  const client = createUserClient(req.accessToken);
  const { data: duplicate, error: duplicateError } = await client
    .from('radiology_reports')
    .select('id')
    .eq('patient_id', patientId)
    .eq('filename', filename)
    .maybeSingle();

  if (duplicateError) {
    logger.error('uploadReport duplicate lookup error', {
      userId: req.userId,
      patientId,
      error: duplicateError.message,
    });
    throw Errors.internal('Failed to check existing reports');
  }

  if (duplicate) {
    throw Errors.conflict('A report with this filename already exists for the patient');
  }

  const path = buildReportStoragePath(req.userId, patientId, filename);
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (uploadError) {
    logger.error('uploadReport storage error', { userId: req.userId, patientId, error: uploadError.message });
    throw Errors.internal('Failed to upload report file');
  }

  // Note: Audit logging for actual report creation happens in createReport
  res.json({
    file_url: path,
    filename,
    file_size: req.file.size,
  });
}

/**
 * Batch upload multiple reports (MIG-67)
 * Accepts up to 50 PDF files and processes them sequentially
 */
export async function batchUploadReports(req: AuthRequest, res: Response): Promise<void> {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    throw Errors.fileError('No files provided');
  }

  const files: Express.Multer.File[] = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files).flat();
  const patientId = String(req.body.patient_id ?? '').trim();

  if (!patientId) {
    throw Errors.validation('patient_id is required');
  }

  // Validate file count
  if (files.length > 50) {
    throw Errors.validation('Maximum 50 files per batch');
  }

  const client = createUserClient(req.accessToken);
  const results: Array<{
    filename: string;
    status: 'success' | 'error';
    report_id?: string;
    file_url?: string;
    file_size?: number;
    error?: string;
  }> = [];

  // Process each file sequentially
  for (const file of files) {
    try {
      // Validate file type
      if (file.mimetype !== 'application/pdf') {
        results.push({
          filename: file.originalname,
          status: 'error',
          error: 'Only PDF files are supported',
        });
        continue;
      }

      // Check for duplicates
      const { data: duplicate, error: duplicateError } = await client
        .from('radiology_reports')
        .select('id')
        .eq('patient_id', patientId)
        .eq('filename', file.originalname)
        .maybeSingle();

      if (duplicateError) {
        results.push({
          filename: file.originalname,
          status: 'error',
          error: 'Failed to check for duplicates',
        });
        continue;
      }

      if (duplicate) {
        results.push({
          filename: file.originalname,
          status: 'error',
          error: 'File with this name already exists for patient',
        });
        continue;
      }

      // Upload file to storage
      const path = buildReportStoragePath(req.userId, patientId, file.originalname);
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

      if (uploadError) {
        results.push({
          filename: file.originalname,
          status: 'error',
          error: 'Failed to upload to storage',
        });
        continue;
      }

      // Create report record in database
      const { data: newReport, error: createError } = await client
        .from('radiology_reports')
        .insert({
          created_by: req.userId,
          patient_id: patientId,
          filename: file.originalname,
          file_url: path,
          file_size: file.size,
          status: 'pending',
          processing_stage: 'queued',
          processing_progress: 0,
          queued_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError || !newReport) {
        logger.error('batchUploadReports database error', {
          userId: req.userId,
          patientId,
          filename: file.originalname,
          error: createError?.message,
        });
        results.push({
          filename: file.originalname,
          status: 'error',
          error: 'Failed to create report record',
        });
        continue;
      }

      try {
        await enqueueReportProcessing(newReport.id);
      } catch (queueError) {
        const message = queueError instanceof Error ? queueError.message : 'Unknown error';
        logger.error('batchUploadReports queue error', {
          userId: req.userId,
          patientId,
          reportId: newReport.id,
          error: message,
        });
        await client
          .from('radiology_reports')
          .update({
            status: 'failed',
            processing_stage: 'failed',
            processing_progress: 0,
            last_error: 'Failed to queue background processing',
          })
          .eq('id', newReport.id);
      }

      results.push({
        filename: file.originalname,
        status: 'success',
        report_id: newReport.id,
        file_url: path,
        file_size: file.size,
      });

      logger.info('Successfully batch uploaded report', {
        userId: req.userId,
        patientId,
        filename: file.originalname,
        fileSize: file.size,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        filename: file.originalname,
        status: 'error',
        error: message,
      });
    }
  }

  // Count successes and failures
  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'error').length;

  res.json({
    patient_id: patientId,
    total_files: files.length,
    successful: successCount,
    failed: failureCount,
    results,
  });
}

export async function getReportSignedUrl(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const { data: report, error } = await client
    .from('radiology_reports')
    .select('id, file_url')
    .eq('id', id)
    .single();

  if (error || !report) {
    throw Errors.notFound('Report not found');
    return;
  }

  if (!report.file_url) {
    throw Errors.notFound('Report file is unavailable');
    return;
  }

  const expiresIn = 60 * 60;
  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(report.file_url, expiresIn);

  if (signedUrlError || !data?.signedUrl) {
    logger.error('getReportSignedUrl error', { userId: req.userId, reportId: id, error: signedUrlError?.message });
    throw Errors.internal('Failed to create signed URL');
    return;
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  res.json({ signed_url: data.signedUrl, expires_at: expiresAt });
}

export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid report data', errors.array());
  }

  const { patient_id, filename, file_url, file_size } = req.body as CreateReportBody;

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('radiology_reports')
    .insert({
      created_by: req.userId,
      patient_id,
      filename,
      file_url,
      file_size,
      status: 'pending',
      processing_stage: 'queued',
      processing_progress: 0,
      queued_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    const isDuplicate = error.code === '23505';
    if (isDuplicate) {
      throw Errors.conflict('A report with this filename already exists for the patient');
    }
    logger.error('createReport error', { userId: req.userId, patientId: patient_id, error: error.message });
    throw Errors.internal('Failed to create report');
  }

  try {
    await enqueueReportProcessing(data.id);
  } catch (queueError) {
    const message = queueError instanceof Error ? queueError.message : 'Unknown error';
    logger.error('createReport queue error', { userId: req.userId, reportId: data.id, error: message });
    await client
      .from('radiology_reports')
      .update({
        status: 'failed',
        processing_stage: 'failed',
        processing_progress: 0,
        last_error: 'Failed to queue background processing',
      })
      .eq('id', data.id);
  }

  const { data: refreshedReport } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', data.id)
    .single();

  logReportAudit(req.userId, 'create_report', data.id, req.accessToken);
  res.status(201).json(refreshedReport ?? data);
}

export async function listReports(req: AuthRequest, res: Response): Promise<void> {
  const patientId = String(req.query.patient_id ?? '').trim();
  const status = String(req.query.status ?? '').trim();

  if (!patientId) {
    throw Errors.validation('patient_id is required');
    return;
  }

  const client = createUserClient(req.accessToken);
  let query = client
    .from('radiology_reports')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('listReports error', { userId: req.userId, patientId, error: error.message });
    throw Errors.internal('Failed to fetch reports');
    return;
  }

  res.json({ reports: data ?? [] });
}

export async function getReport(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw Errors.notFound('Report not found');
    return;
  }

  res.json(data);
}

export async function updateReport(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body as ReportUpdateBody;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of REPORT_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('radiology_reports')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    logger.error('updateReport error', { userId: req.userId, reportId: id, error: error?.message });
    throw Errors.notFound('Report');
  }

  logReportAudit(req.userId, 'update_report', id as string, req.accessToken);
  res.json(data);
}

export async function deleteReport(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { data: report, error: reportError } = await client
    .from('radiology_reports')
    .select('id, file_url')
    .eq('id', id)
    .single();

  if (reportError || !report) {
    throw Errors.notFound('Report');
  }

  if (report.file_url) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([report.file_url]);
    if (storageError) {
      logger.error('deleteReport storage error', { userId: req.userId, reportId: id, error: storageError.message });
      throw Errors.internal('Failed to remove report file');
    }
  }

  const { error: deleteError } = await client
    .from('radiology_reports')
    .delete()
    .eq('id', id);

  if (deleteError) {
    logger.error('deleteReport row error', { userId: req.userId, reportId: id, error: deleteError.message });
    throw Errors.internal('Failed to delete report');
  }

  logReportAudit(req.userId, 'delete_report', id as string, req.accessToken);
  res.status(204).send();
}

export async function exportReportJson(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);

  const { data: report, error } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !report) {
    throw Errors.notFound('Report not found');
    return;
  }

  const exportData = {
    id: report.id,
    filename: report.filename,
    created_at: report.created_at,
    updated_at: report.updated_at,
    status: report.status,
    extraction: {
      birads_value: report.birads_value,
      birads_confidence: report.birads_confidence,
      birads_evidence: report.birads_evidence,
      breast_density_value: report.breast_density_value,
      breast_density_evidence: report.breast_density_evidence,
      exam_type: report.exam_type,
      exam_laterality: report.exam_laterality,
      exam_evidence: report.exam_evidence,
      comparison_prior_exam_date: report.comparison_prior_exam_date,
      comparison_evidence: report.comparison_evidence,
      findings: report.findings,
      recommendations: report.recommendations,
      red_flags: report.red_flags,
    },
    verification: {
      summary: report.summary,
      processing_time_ms: report.processing_time_ms,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="report-${id}.json"`);
  res.json(exportData);
}

export async function processReport(req: AuthRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const client = createUserClient(req.accessToken);
  const { data: report, error } = await client
    .from('radiology_reports')
    .select('id')
    .eq('id', id)
    .single();

  if (error || !report) {
    throw Errors.notFound('Report not found');
  }

  await enqueueReportProcessing(id);
  logReportAudit(req.userId, 'queue_report_processing', id, req.accessToken);

  const { data: queuedReport, error: queuedError } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (queuedError || !queuedReport) {
    throw Errors.internal('Failed to reload queued report');
  }

  res.status(202).json(queuedReport);
}
