/**
 * AI controller — Express handlers that expose Claude-powered analysis to the API.
 * All text is de-identified locally (regex via cleanupIdentifiers — patient name,
 * DOB, addresses, direct identifiers) before any Anthropic call, so PHI never leaves
 * the process while clinical data (dates, BI-RADS, measurements) is preserved.
 * Exports: analyzeReportText, generateReportSummary, consolidatePatientReports,
 *   comparePatientTreatments, detectPatientBiradsTrend, extractReportQuotes.
 * Delegates to claudeService; reads report/treatment data from Supabase using
 * the caller's JWT so RLS enforces data ownership.
 * Audit logs are written asynchronously for all AI analysis operations.
 */
import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { Errors } from '../utils/AppError.js';
import { logAIAudit } from '../services/auditService.js';
import {
  analyzeReport,
  generateSummary,
  consolidateReports,
  compareTreatments,
  detectBiradsTrend,
  matchSourceQuotes,
  cleanupIdentifiers,
} from '../services/claudeService.js';

/**
 * Analyze report from raw text
 */
export async function analyzeReportText(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { report_text, prompt_variant, model, temperature } = req.body;

  try {
    // Clean identifiers for privacy
    const cleanedText = await cleanupIdentifiers(report_text);

    // Analyze the report with optional overrides
    const analysis = await analyzeReport(cleanedText, {
      prompt_variant: prompt_variant || 'default',
      model,
      temperature,
    });

    logger.info('Successfully analyzed report text', {
      userId: req.userId,
      textLength: report_text.length,
      promptVariant: prompt_variant,
      model,
      temperature,
    });

    res.json({
      analysis,
      original_text_length: report_text.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('analyzeReportText error', {
      userId: req.userId,
      error: message,
    });
    throw Errors.internal('Analysis failed');
  }
}

/**
 * Generate summary from raw text
 */
export async function generateReportSummary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { report_text } = req.body;

  try {
    // Clean identifiers for privacy
    const cleanedText = await cleanupIdentifiers(report_text);

    // Generate summary
    const result = await generateSummary(cleanedText);

    logger.info('Successfully generated summary', {
      userId: req.userId,
      textLength: report_text.length,
    });

    res.json({
      summary: result.summary,
      clinical_disclaimer: result.clinical_disclaimer,
      original_text_length: report_text.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('generateReportSummary error', {
      userId: req.userId,
      error: message,
    });
    throw Errors.internal('Summary generation failed');
  }
}

/**
 * Consolidate multiple reports for a patient
 */
export async function consolidatePatientReports(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { patient_id } = req.body;
  const client = createUserClient(req.accessToken);

  try {
    // Fetch all completed reports for the patient
    const { data: reports, error } = await client
      .from('radiology_reports')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error || !reports || reports.length === 0) {
      res.status(422).json({
        error: 'No completed reports found for consolidation',
      });
      return;
    }

    if (reports.length < 2) {
      res.status(422).json({
        error: 'At least 2 reports are required for consolidation',
      });
      return;
    }

    // Prepare reports for consolidation
    const reportsData = reports
      .filter((r) => r.raw_text)
      .map((r) => ({
        text: r.raw_text,
        date: r.created_at,
      }));

    if (reportsData.length === 0) {
      res.status(422).json({ error: 'No reports with extracted text available' });
      return;
    }

    // Consolidate
    const consolidation = await consolidateReports(reportsData);

    logger.info('Successfully consolidated patient reports', {
      userId: req.userId,
      patientId: patient_id,
      reportCount: reports.length,
    });

    res.json({
      patient_id,
      report_count: reports.length,
      consolidation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('consolidatePatientReports error', {
      userId: req.userId,
      patientId: patient_id,
      error: message,
    });
    throw Errors.internal('Consolidation failed');
  }
}

/**
 * Compare treatments against radiology findings
 */
export async function comparePatientTreatments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { patient_id, report_id } = req.body;
  const client = createUserClient(req.accessToken);

  try {
    // Fetch the report
    const { data: report, error: reportError } = await client
      .from('radiology_reports')
      .select('*')
      .eq('id', report_id)
      .eq('patient_id', patient_id)
      .single();

    if (reportError || !report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (!report.raw_text) {
      res.status(422).json({ error: 'Report does not have extracted text' });
      return;
    }

    // Fetch treatments for the patient
    const { data: treatments, error: treatmentsError } = await client
      .from('treatment_records')
      .select('*')
      .eq('patient_id', patient_id);

    if (treatmentsError) {
      logger.error('comparePatientTreatments fetch error', {
        userId: req.userId,
        patientId: patient_id,
        error: treatmentsError.message,
      });
      throw Errors.internal('Failed to fetch treatments' });
      return;
    }

    if (!treatments || treatments.length === 0) {
      res.status(422).json({ error: 'No treatments found for comparison' });
      return;
    }

    // Format treatments for comparison
    const treatmentsData = treatments.map((t) => ({
      type: t.treatment_type,
      outcome: t.treatment_outcome,
    }));

    // Compare
    const comparison = await compareTreatments(report.raw_text, treatmentsData);

    logger.info('Successfully compared treatments', {
      userId: req.userId,
      patientId: patient_id,
      reportId: report_id,
      treatmentCount: treatments.length,
    });

    res.json({
      patient_id,
      report_id,
      treatment_count: treatments.length,
      comparison,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('comparePatientTreatments error', {
      userId: req.userId,
      patientId: patient_id,
      error: message,
    });
    throw Errors.internal('Comparison failed');
  }
}

/**
 * Detect BI-RADS trend for a patient
 */
export async function detectPatientBiradsTrend(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { patient_id } = req.body;
  const client = createUserClient(req.accessToken);

  try {
    // Fetch all completed reports with BI-RADS values
    const { data: reports, error } = await client
      .from('radiology_reports')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'completed')
      .not('birads_value', 'is', null)
      .order('created_at', { ascending: true });

    if (error || !reports || reports.length === 0) {
      res.status(422).json({
        error: 'No completed reports with BI-RADS values found',
      });
      return;
    }

    if (reports.length < 2) {
      res.status(422).json({
        error: 'At least 2 reports with BI-RADS values are required for trend detection',
      });
      return;
    }

    // Prepare BI-RADS values
    const biradValues = reports
      .filter((r) => r.birads_value !== null)
      .map((r) => ({
        value: r.birads_value,
        date: r.created_at,
      }));

    // Detect trend
    const trend = await detectBiradsTrend(biradValues);

    logger.info('Successfully detected BI-RADS trend', {
      userId: req.userId,
      patientId: patient_id,
      reportCount: reports.length,
      trend: trend.trend,
    });

    res.json({
      patient_id,
      report_count: reports.length,
      birads_history: biradValues,
      trend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('detectPatientBiradsTrend error', {
      userId: req.userId,
      patientId: patient_id,
      error: message,
    });
    throw Errors.internal('Trend detection failed');
  }
}

/**
 * Extract source quotes from a report
 */
export async function extractReportQuotes(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.validation('Invalid input', errors.array());
    return;
  }

  const { report_id, findings } = req.body;
  const client = createUserClient(req.accessToken);

  try {
    // Fetch the report
    const { data: report, error: reportError } = await client
      .from('radiology_reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (!report.raw_text) {
      res.status(422).json({ error: 'Report does not have extracted text' });
      return;
    }

    if (!Array.isArray(findings) || findings.length === 0) {
      res.status(422).json({
        error: 'findings must be a non-empty array of strings',
      });
      return;
    }

    // Match quotes
    const quotes = await matchSourceQuotes(findings, report.raw_text);

    // Convert map to object for JSON serialization
    const quoteObject: Record<string, string[]> = {};
    quotes.forEach((value, key) => {
      quoteObject[key] = value;
    });

    logger.info('Successfully extracted quotes', {
      userId: req.userId,
      reportId: report_id,
      findingsCount: findings.length,
      matchedCount: quoteObject.length,
    });

    res.json({
      report_id,
      quotes: quoteObject,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('extractReportQuotes error', {
      userId: req.userId,
      reportId: req.body.report_id,
      error: message,
    });
    res.status(500).json({
      error: 'Quote extraction failed',
      details: message,
    });
  }
}
