import type { Request, Response } from 'express';
import { extractPdfText } from '../services/pdfService.js';
import { supabase } from '../services/supabaseClient.js';
import { analyzeReportText, generatePatientSummary } from '../services/claudeService.js';
import { env } from '../utils/env.js';

export const uploadReport = async (request: Request, response: Response) => {
  const file = request.file;
  const patientId = String(request.body.patient_id ?? '');
  if (!file || !patientId) {
    response.status(400).json({ error: 'patient_id and file are required.' });
    return;
  }

  const { data: duplicate } = await supabase
    .from('radiology_reports')
    .select('id')
    .eq('created_by', request.user!.id)
    .eq('patient_id', patientId)
    .eq('filename', file.originalname)
    .maybeSingle();

  if (duplicate) {
    response.status(409).json({ error: 'A report with this filename already exists for the patient.' });
    return;
  }

  const storagePath = `${request.user!.id}/${patientId}/${Date.now()}-${file.originalname}`;
  const uploadResult = await supabase.storage
    .from(env.STORAGE_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadResult.error) {
    response.status(400).json({ error: uploadResult.error.message });
    return;
  }

  const { data: publicUrlData } = supabase.storage.from(env.STORAGE_BUCKET).getPublicUrl(storagePath);
  response.status(201).json({
    filename: file.originalname,
    file_url: publicUrlData.publicUrl,
    file_size: file.size,
    storage_path: storagePath,
  });
};

export const createReport = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('radiology_reports')
    .insert({ ...request.body, created_by: request.user!.id, status: request.body.status ?? 'pending' })
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(201).json({ report: data });
};

export const processReport = async (request: Request, response: Response) => {
  const reportId = String(request.body.reportId ?? request.body.report_id ?? '');
  if (!reportId) {
    response.status(400).json({ error: 'reportId is required.' });
    return;
  }

  const startedAt = Date.now();
  const { data: report, error } = await supabase
    .from('radiology_reports')
    .select('*')
    .eq('id', reportId)
    .eq('created_by', request.user!.id)
    .single();

  if (error) {
    response.status(404).json({ error: error.message });
    return;
  }

  await supabase.from('radiology_reports').update({ status: 'processing' }).eq('id', reportId);

  try {
    const pdfText = request.body.pdf_text
      ? String(request.body.pdf_text)
      : await (async () => {
          const fileResponse = await fetch(report.file_url as string);
          const arrayBuffer = await fileResponse.arrayBuffer();
          return extractPdfText(Buffer.from(arrayBuffer));
        })();

    const analysis = await analyzeReportText(pdfText);
    const summary = await generatePatientSummary(analysis);

    const { data: updated, error: updateError } = await supabase
      .from('radiology_reports')
      .update({
        status: 'completed',
        summary,
        birads_value: analysis.birads.value,
        birads_confidence: analysis.birads.confidence,
        birads_evidence: analysis.birads.evidence,
        breast_density_value: analysis.breast_density.value,
        breast_density_evidence: analysis.breast_density.evidence,
        exam_type: analysis.exam.type,
        exam_laterality: analysis.exam.laterality,
        exam_evidence: analysis.exam.evidence,
        comparison_prior_exam_date: analysis.comparison.prior_exam_date,
        comparison_evidence: analysis.comparison.evidence,
        findings: analysis.findings,
        recommendations: analysis.recommendations,
        red_flags: analysis.red_flags,
        raw_text: pdfText,
        processing_time_ms: Date.now() - startedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('created_by', request.user!.id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    response.json({ report: updated, analysis, summary });
  } catch (processingError) {
    await supabase
      .from('radiology_reports')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .eq('created_by', request.user!.id);

    response.status(500).json({
      error: processingError instanceof Error ? processingError.message : 'Unable to process report.',
    });
  }
};

export const listReports = async (request: Request, response: Response) => {
  let query = supabase.from('radiology_reports').select('*').eq('created_by', request.user!.id);
  if (request.query.patient_id) {
    query = query.eq('patient_id', String(request.query.patient_id));
  }
  if (request.query.status) {
    query = query.eq('status', String(request.query.status));
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ reports: data });
};

export const getReport = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('radiology_reports')
    .select('*')
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .single();

  if (error) {
    response.status(404).json({ error: error.message });
    return;
  }

  response.json({ report: data });
};

export const updateReport = async (request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('radiology_reports')
    .update({ ...request.body, updated_at: new Date().toISOString() })
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id)
    .select('*')
    .single();

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.json({ report: data });
};

export const deleteReport = async (request: Request, response: Response) => {
  const { error } = await supabase
    .from('radiology_reports')
    .delete()
    .eq('id', request.params.id)
    .eq('created_by', request.user!.id);

  if (error) {
    response.status(400).json({ error: error.message });
    return;
  }

  response.status(204).send();
};
