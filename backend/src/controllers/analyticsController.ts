/**
 * Analytics controller — aggregated reporting and CSV export for the dashboard.
 * Exports: getAnalytics, exportAnalyticsCsv.
 * getAnalytics returns summary stats, BI-RADS distribution, monthly trend, and
 * cancer-stage breakdown filtered by optional date range / stage / treatment type.
 * exportAnalyticsCsv streams the same filtered dataset as a downloadable CSV.
 * Data is scoped to the authenticated user's patients via RLS (created_by filter).
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  cancerStage?: string;
  treatmentType?: string;
}

export async function getAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const { startDate, endDate, cancerStage, treatmentType } = req.query as Record<string, string | undefined>;

  const filters: AnalyticsFilters = {
    startDate,
    endDate,
    cancerStage,
    treatmentType,
  };

  const client = createUserClient(req.accessToken);

  // Fetch patients (filters by created_by for RLS)
  const { data: patients, error: patientsError } = await client
    .from('patients')
    .select('id, cancer_stage, created_at')
    .eq('created_by', req.userId);

  if (patientsError) {
    logger.error('getAnalytics patients error', { userId: req.userId, error: patientsError.message });
    res.status(500).json({ error: 'Failed to fetch analytics' });
    return;
  }

  // Filter patients by cancer_stage if provided
  let filteredPatients = patients ?? [];
  if (filters.cancerStage) {
    filteredPatients = filteredPatients.filter((p) => p.cancer_stage === filters.cancerStage);
  }

  const patientIds = filteredPatients.map((p) => p.id);

  // Fetch reports
  let reportsQuery = client
    .from('radiology_reports')
    .select('id, patient_id, created_at, status, birads_value, processing_time_ms');

  if (patientIds.length > 0) {
    reportsQuery = reportsQuery.in('patient_id', patientIds);
  }

  const { data: reports, error: reportsError } = await reportsQuery;

  if (reportsError) {
    logger.error('getAnalytics reports error', { userId: req.userId, error: reportsError.message });
    res.status(500).json({ error: 'Failed to fetch reports' });
    return;
  }

  // Filter reports by date range
  let filteredReports = reports ?? [];
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) <= end);
  }

  // Fetch treatments if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let treatments: any[] = [];
  if (filters.treatmentType && patientIds.length > 0) {
    const { data: treatmentData, error: treatmentError } = await client
      .from('treatment_records')
      .select('id, patient_id, treatment_type, treatment_start_date')
      .in('patient_id', patientIds)
      .eq('treatment_type', filters.treatmentType);

    if (!treatmentError) {
      treatments = treatmentData ?? [];
    }
  }

  // Calculate analytics
  const totalReports = filteredReports.length;
  const completedReports = filteredReports.filter((r) => r.status === 'completed').length;
  const failedReports = filteredReports.filter((r) => r.status === 'failed').length;
  const avgProcessingTime = filteredReports.length > 0
    ? filteredReports.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / filteredReports.length
    : 0;

  // BI-RADS distribution
  const biradsDistribution = {
    '1-2': filteredReports.filter((r) => r.birads_value && r.birads_value <= 2).length,
    '3': filteredReports.filter((r) => r.birads_value === 3).length,
    '4A': filteredReports.filter((r) => r.birads_value === 4).length,
    '4B-4C': filteredReports.filter((r) => r.birads_value === 4).length,
    '5': filteredReports.filter((r) => r.birads_value === 5).length,
  };

  // Monthly trend (last 12 months)
  const monthlyData: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    monthlyData[monthKey] = filteredReports.filter((r) => r.created_at.startsWith(monthKey)).length;
  }

  // Cancer stage distribution
  const cancerStageDistribution: Record<string, number> = {};
  filteredPatients.forEach((p) => {
    const stage = p.cancer_stage || 'Unknown';
    cancerStageDistribution[stage] = (cancerStageDistribution[stage] || 0) + 1;
  });

  res.json({
    summary: {
      total_reports: totalReports,
      completed_reports: completedReports,
      failed_reports: failedReports,
      avg_processing_time_ms: Math.round(avgProcessingTime),
      total_patients: filteredPatients.length,
    },
    birads_distribution: biradsDistribution,
    monthly_trend: monthlyData,
    cancer_stage_distribution: cancerStageDistribution,
    treatment_count: treatments.length,
    filters_applied: filters,
  });
}

export async function exportAnalyticsCsv(req: AuthRequest, res: Response): Promise<void> {
  const { startDate, endDate, cancerStage, treatmentType } = req.query as Record<string, string | undefined>;

  const filters: AnalyticsFilters = {
    startDate,
    endDate,
    cancerStage,
    treatmentType,
  };

  const client = createUserClient(req.accessToken);

  const { data: patients, error: patientsError } = await client
    .from('patients')
    .select('id, full_name, cancer_stage, cancer_type, created_at')
    .eq('created_by', req.userId);

  if (patientsError) {
    logger.error('exportAnalyticsCsv patients error', { userId: req.userId, error: patientsError.message });
    res.status(500).json({ error: 'Failed to export analytics' });
    return;
  }

  let filteredPatients = patients ?? [];
  if (filters.cancerStage) {
    filteredPatients = filteredPatients.filter((p) => p.cancer_stage === filters.cancerStage);
  }

  const patientIds = filteredPatients.map((p) => p.id);

  let reportsQuery = client
    .from('radiology_reports')
    .select('id, patient_id, filename, created_at, status, birads_value, summary');

  if (patientIds.length > 0) {
    reportsQuery = reportsQuery.in('patient_id', patientIds);
  }

  const { data: reports, error: reportsError } = await reportsQuery;

  if (reportsError) {
    logger.error('exportAnalyticsCsv reports error', { userId: req.userId, error: reportsError.message });
    res.status(500).json({ error: 'Failed to fetch reports' });
    return;
  }

  let filteredReports = reports ?? [];
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    filteredReports = filteredReports.filter((r) => new Date(r.created_at) <= end);
  }

  // Generate CSV
  const headers = ['Patient ID', 'Report ID', 'Filename', 'Status', 'BI-RADS', 'Created Date'];
  const rows = filteredReports.map((report) => [
    report.patient_id,
    report.id,
    report.filename,
    report.status,
    report.birads_value || 'N/A',
    new Date(report.created_at).toISOString().split('T')[0],
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
  res.send(csvContent);
}
