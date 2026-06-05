import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Report {
  id: string;
  created_by: string;
  patient_id: string;
  filename: string;
  file_url: string | null;
  file_size: number | null;
  status: ReportStatus;
  summary: string | null;
  birads_value: number | null;
  birads_confidence: string | null;
  processing_time_ms: number | null;
  breast_density_value: string | null;
  exam_type: string | null;
  exam_laterality: string | null;
  red_flags: string[] | null;
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
