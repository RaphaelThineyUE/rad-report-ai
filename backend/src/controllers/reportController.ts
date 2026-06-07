/**
 * Report controller — PDF upload, storage, AI processing, and export for radiology reports.
 * Exports: uploadReport, batchUploadReports (≤50 files), createReport, listReports,
 *   getReport, updateReport, deleteReport, getReportSignedUrl, exportReportJson, processReport.
 * processReport: downloads PDF via supabaseAdmin storage → validates → extracts text via
 *   pdfService → de-identifies locally via cleanupIdentifiers (regex + wink-nlp NER)
 *   → analyzes via claudeService → saves results.
 * supabaseAdmin is used for storage operations (upload, download, signed URL, delete);
 * the caller's JWT client is used for all DB queries so RLS enforces ownership.
 */
import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { extractTextFromPdf, isValidPdf } from '../services/pdfService.js';
import {
  analyzeReport,
  generateSummary,
  cleanupIdentifiers,
  detectBiradsTrend,
} from '../services/claudeService.js';

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
  birads_value?: number | null;
  birads_confidence?: 'low' | 'medium' | 'high' | null;
  birads_evidence?: unknown;
  breast_density_value?: string | null;
  breast_density_evidence?: unknown;
  exam_type?: string | null;
  exam_laterality?: string | null;
  exam_evidence?: unknown;
  comparison_prior_exam_date?: string | null;
  comparison_evidence?: unknown;
  findings?: unknown;
  recommendations?: unknown;
  red_flags?: unknown;
  processing_time_ms?: number | null;
  raw_text?: string | null;
}

const REPORT_UPDATE_FIELDS: (keyof ReportUpdateBody)[] = [
  'status',
  'summary',
  'birads_value',
  'birads_confidence',
  'birads_evidence',
  'breast_density_value',
  'breast_density_evidence',
  'exam_type',
  'exam_laterality',
  'exam_evidence',
  'comparison_prior_exam_date',
  'comparison_evidence',
  'findings',
  'recommendations',
  'red_flags',
  'processing_time_ms',
  'raw_text',
];

function normalizeFilename(filename: string): string {
  return filename.replace(/[^\w.-]+/g, '_');
}

export async function uploadReport(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' });
    return;
  }

  if (req.file.mimetype !== 'application/pdf') {
    res.status(422).json({ error: 'Only PDF uploads are supported' });
    return;
  }

  const patientId = String(req.body.patient_id ?? '').trim();
  if (!patientId) {
    res.status(422).json({ error: 'patient_id is required' });
    return;
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
    res.status(500).json({ error: 'Failed to check existing reports' });
    return;
  }

  if (duplicate) {
    res.status(409).json({ error: 'A report with this filename already exists for the patient' });
    return;
  }

  const path = `${req.userId}/${patientId}/${Date.now()}-${normalizeFilename(filename)}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (uploadError) {
    logger.error('uploadReport storage error', { userId: req.userId, patientId, error: uploadError.message });
    res.status(500).json({ error: 'Failed to upload report file' });
    return;
  }

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
    res.status(400).json({ error: 'No files provided' });
    return;
  }

  const files: Express.Multer.File[] = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files).flat();
  const patientId = String(req.body.patient_id ?? '').trim();

  if (!patientId) {
    res.status(422).json({ error: 'patient_id is required' });
    return;
  }

  // Validate file count
  if (files.length > 50) {
    res.status(422).json({ error: 'Maximum 50 files per batch' });
    return;
  }

  const client = createUserClient(req.accessToken);
  const results: Array<{
    filename: string;
    status: 'success' | 'error';
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
      const path = `${req.userId}/${patientId}/${Date.now()}-${normalizeFilename(file.originalname)}`;
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
          patient_id: patientId,
          filename: file.originalname,
          file_url: path,
          file_size: file.size,
          status: 'pending',
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

      results.push({
        filename: file.originalname,
        status: 'success',
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
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  if (!report.file_url) {
    res.status(404).json({ error: 'Report file is unavailable' });
    return;
  }

  const expiresIn = 60 * 60;
  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(report.file_url, expiresIn);

  if (signedUrlError || !data?.signedUrl) {
    logger.error('getReportSignedUrl error', { userId: req.userId, reportId: id, error: signedUrlError?.message });
    res.status(500).json({ error: 'Failed to create signed URL' });
    return;
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  res.json({ signed_url: data.signedUrl, expires_at: expiresAt });
}

export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
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
    })
    .select('*')
    .single();

  if (error) {
    const isDuplicate = error.code === '23505';
    if (isDuplicate) {
      res.status(409).json({ error: 'A report with this filename already exists for the patient' });
      return;
    }
    logger.error('createReport error', { userId: req.userId, patientId: patient_id, error: error.message });
    res.status(500).json({ error: 'Failed to create report' });
    return;
  }

  res.status(201).json(data);
}

export async function listReports(req: AuthRequest, res: Response): Promise<void> {
  const patientId = String(req.query.patient_id ?? '').trim();
  const status = String(req.query.status ?? '').trim();

  if (!patientId) {
    res.status(422).json({ error: 'patient_id is required' });
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
    res.status(500).json({ error: 'Failed to fetch reports' });
    return;
  }

  res.json({ reports: data ?? [] });
}

export async function getReport(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const { data, error } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  res.json(data);
}

export async function updateReport(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
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
    res.status(404).json({ error: 'Report not found or update failed' });
    return;
  }

  res.json(data);
}

export async function deleteReport(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const { data: report, error: reportError } = await client
    .from('radiology_reports')
    .select('id, file_url')
    .eq('id', id)
    .single();

  if (reportError || !report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  if (report.file_url) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([report.file_url]);
    if (storageError) {
      logger.error('deleteReport storage error', { userId: req.userId, reportId: id, error: storageError.message });
      res.status(500).json({ error: 'Failed to remove report file' });
      return;
    }
  }

  const { error: deleteError } = await client
    .from('radiology_reports')
    .delete()
    .eq('id', id);

  if (deleteError) {
    logger.error('deleteReport row error', { userId: req.userId, reportId: id, error: deleteError.message });
    res.status(500).json({ error: 'Failed to delete report' });
    return;
  }

  res.status(204).send();
}

export async function exportReportJson(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = createUserClient(req.accessToken);

  const { data: report, error } = await client
    .from('radiology_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !report) {
    res.status(404).json({ error: 'Report not found' });
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
  const { id } = req.params;
  const client = createUserClient(req.accessToken);
  const startTime = Date.now();

  try {
    // Fetch the report
    const { data: report, error: reportError } = await client
      .from('radiology_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (!report.file_url) {
      res.status(422).json({ error: 'Report file URL is missing' });
      return;
    }

    // Update status to processing
    await client
      .from('radiology_reports')
      .update({ status: 'processing' })
      .eq('id', id);

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(report.file_url);

    if (downloadError || !fileData) {
      logger.error('processReport download error', { userId: req.userId, reportId: id, error: downloadError?.message });
      await client
        .from('radiology_reports')
        .update({
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', id);
      res.status(500).json({ error: 'Failed to download report file' });
      return;
    }

    // Validate PDF
    const isValid = await isValidPdf(fileData);
    if (!isValid) {
      logger.error('processReport invalid PDF', { userId: req.userId, reportId: id });
      await client
        .from('radiology_reports')
        .update({
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', id);
      res.status(422).json({ error: 'Invalid PDF file' });
      return;
    }

    // Extract text from PDF
    let extractedText = await extractTextFromPdf(fileData);
    const rawText = extractedText;

    // Clean up identifiers
    extractedText = await cleanupIdentifiers(extractedText);

    // Analyze the report
    const analysis = await analyzeReport(extractedText);

    // Generate summary if not already present
    let summary = analysis.summary;
    if (!summary) {
      const summaryResult = await generateSummary(extractedText);
      summary = summaryResult.summary;
    }

    // Detect BI-RADS trend if available
    let biradsTrend = null;
    if (analysis.birads_value && report.birads_value) {
      const trendData = await detectBiradsTrend([
        { value: report.birads_value, date: report.created_at },
        { value: analysis.birads_value, date: new Date().toISOString() },
      ]);
      biradsTrend = trendData;
    }

    const processingTime = Date.now() - startTime;

    // Prepare updates
    const updates: ReportUpdateBody = {
      status: 'completed',
      summary,
      birads_value: analysis.birads_value,
      birads_confidence: analysis.birads_confidence,
      birads_evidence: analysis.findings.map((f) => f.assessment),
      breast_density_value: analysis.breast_density_value,
      breast_density_evidence: [analysis.breast_density_value],
      exam_type: analysis.exam_type,
      exam_laterality: analysis.exam_laterality,
      exam_evidence: [analysis.exam_type, analysis.exam_laterality],
      comparison_prior_exam_date: analysis.comparison_prior_exam_date,
      comparison_evidence: analysis.comparison_prior_exam_date ? [analysis.comparison_prior_exam_date] : [],
      findings: analysis.findings,
      recommendations: analysis.recommendations,
      red_flags: analysis.red_flags,
      processing_time_ms: processingTime,
      raw_text: rawText,
    };

    // Update the report in the database
    const { data: updatedReport, error: updateError } = await client
      .from('radiology_reports')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedReport) {
      logger.error('processReport update error', { userId: req.userId, reportId: id, error: updateError?.message });
      res.status(500).json({ error: 'Failed to save analysis results' });
      return;
    }

    logger.info('Successfully processed report', { userId: req.userId, reportId: id, processingTime });

    res.json({
      report: updatedReport,
      processing_time_ms: processingTime,
      birads_trend: biradsTrend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('processReport error', { userId: req.userId, reportId: id, error: message });

    // Try to update status to failed
    try {
      await client
        .from('radiology_reports')
        .update({
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', id);
    } catch (updateErr) {
      logger.error('Failed to update report status to failed', { error: updateErr instanceof Error ? updateErr.message : 'Unknown' });
    }

    res.status(500).json({ error: 'Report processing failed', details: message });
  }
}
