/**
 * TanStack Query hooks for radiology report operations against the backend API.
 * Handles report listing, creation, deletion, signed-URL retrieval, and multi-file batch upload.
 * All server state for reports flows through these hooks; components never call api.ts directly.
 * Exports: useReports, useCreateReport, useDeleteReport, useReportSignedUrl, useBatchUpload.
 * Also exports Report, CreateReportInput, UploadReportResponse, BatchUploadInput, ReportStatus types.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReportFinding {
  laterality: string;
  location: string;
  description: string;
  assessment: string;
  evidence: string[];
  finding_type?: string;
  size_mm?: number;
  per_finding_birads?: number;
  interval_change?: string;
  clock_position?: string;
  distance_from_nipple_cm?: number;
  quadrant?: string;
  depth?: string;
  shape?: string;
  margin?: string;
  calcification_morphology?: string;
  calcification_distribution?: string;
  ultrasound_features?: string;
  mri_features?: string;
}

export interface ReportRecommendation {
  action: string;
  timeframe: string;
  evidence: string[];
}

export interface ReportLymphNode {
  laterality: string;
  region?: string;
  abnormal: boolean;
  morphology?: string;
  size_mm?: number;
  evidence: string[];
}

export interface ReportImplant {
  present: boolean;
  type?: string;
  integrity?: string;
}

export interface ReportManagement {
  biopsy_recommended: boolean;
  recommended_modality?: string;
  follow_up_interval?: string;
}

export interface Report {
  id: string;
  created_by: string;
  patient_id: string;
  filename: string;
  file_url: string | null;
  file_size: number | null;
  status: ReportStatus;
  summary: string | null;
  // Exam
  exam_date: string | null;
  modality: string | null;
  contrast: string | null;
  exam_type: string | null;
  exam_laterality: string | null;
  exam_evidence: string[] | null;
  // Assessment
  birads_value: number | null;
  birads_confidence: string | null;
  birads_evidence: string[] | null;
  breast_density_value: string | null;
  breast_density_evidence: string[] | null;
  // Clinical context
  clinical_history: string | null;
  risk_factors: string[] | null;
  comparison_prior_exam_date: string | null;
  comparison_dates: string[] | null;
  comparison_evidence: string[] | null;
  // Findings
  findings: ReportFinding[] | null;
  lymph_nodes: ReportLymphNode[] | null;
  skin_nipple_changes: string[] | null;
  implants: ReportImplant | null;
  post_surgical_changes: string[] | null;
  // Disease extent
  multifocal: boolean | null;
  multicentric: boolean | null;
  bilateral_disease: boolean | null;
  disease_extent: string | null;
  // Outcomes
  recommendations: ReportRecommendation[] | null;
  management: ReportManagement | null;
  pathology_correlation: string | null;
  red_flags: string[] | null;
  // Meta
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  patient_id: string;
  filename: string;
  file_url: string;
  file_size: number;
}

export interface UploadReportResponse {
  file_url: string;
  filename: string;
  file_size: number;
}

export function useReports(patientId: string | undefined, status?: ReportStatus) {
  return useQuery({
    queryKey: ['reports', patientId, status],
    queryFn: async () => {
      const { data } = await api.get<{ reports: Report[] }>('/api/reports', {
        params: { patient_id: patientId, ...(status ? { status } : {}) },
      });
      return data.reports;
    },
    enabled: !!patientId,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const { data } = await api.post<Report>('/api/reports', input);
      return data;
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports', report.patient_id] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patientId }: { id: string; patientId: string }) => {
      await api.delete(`/api/reports/${id}`);
      return { id, patientId };
    },
    onSuccess: ({ id, patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['reports', patientId] });
      queryClient.removeQueries({ queryKey: ['report', id] });
    },
  });
}

export function useReportSignedUrl() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await api.get<{ signed_url: string; expires_at: string }>(`/api/reports/${reportId}/url`);
      return data;
    },
  });
}

export interface BatchUploadInput {
  patientId: string;
  files: File[];
}

export function useBatchUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ patientId, files }: BatchUploadInput) => {
      const results: { file: File; report: Report }[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', patientId);

        const uploadResponse = await api.post<UploadReportResponse>('/api/reports/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const report = await api.post<Report>('/api/reports', {
          patient_id: patientId,
          filename: uploadResponse.data.filename,
          file_url: uploadResponse.data.file_url,
          file_size: uploadResponse.data.file_size,
        });

        results.push({ file, report: report.data });
      }

      return results;
    },
    onSuccess: (results) => {
      if (results.length > 0) {
        const patientId = results[0].report.patient_id;
        queryClient.invalidateQueries({ queryKey: ['reports', patientId] });
      }
    },
  });
}
