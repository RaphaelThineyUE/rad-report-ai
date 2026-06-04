import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient';
import { logger } from '../utils/logger';

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
