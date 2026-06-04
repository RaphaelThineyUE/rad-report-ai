import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Report } from '../types/domain';

export const useReports = (patientId?: string) =>
  useQuery({
    queryKey: ['reports', patientId],
    queryFn: async () => {
      const { data } = await api.get<{ reports: Report[] }>('/api/reports', {
        headers: patientId ? { 'x-patient-id': patientId } : undefined,
      });
      return data.reports;
    },
  });

export const useUploadReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ patientId, file }: { patientId: string; file: File }) => {
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('file', file);
      const upload = await api.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = await api.post<{ report: Report }>('/api/reports', {
        patient_id: patientId,
        filename: file.name,
        file_url: upload.data.file_url,
        file_size: file.size,
      });
      return created.data.report;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useProcessReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await api.post<{ report: Report }>('/api/reports/process', { reportId });
      return data.report;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/api/reports/${reportId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
