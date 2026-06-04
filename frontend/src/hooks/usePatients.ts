import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Patient } from '../types/domain';

export const usePatients = (search = '', stage = '') =>
  useQuery({
    queryKey: ['patients', search, stage],
    queryFn: async () => {
      const { data } = await api.get<{ patients: Patient[] }>('/api/patients', { params: { search, stage } });
      return data.patients;
    },
  });

export const usePatient = (id?: string) =>
  useQuery({
    queryKey: ['patient', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ patient: Patient }>(`/api/patients/${id}`);
      return data.patient;
    },
  });

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Patient>) => {
      const { data } = await api.post<{ patient: Patient }>('/api/patients', payload);
      return data.patient;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
