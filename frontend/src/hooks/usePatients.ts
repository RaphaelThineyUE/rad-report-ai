import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Patient {
  id: string;
  created_by: string;
  name: string;
  date_of_birth: string | null;
  sex: 'M' | 'F' | 'Other' | null;
  mrn: string | null;
  stage: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientFilters {
  search?: string;
  stage?: string;
  sort?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface CreatePatientInput {
  name: string;
  date_of_birth?: string;
  sex?: 'M' | 'F' | 'Other';
  mrn?: string;
  stage?: string;
  notes?: string;
}

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.stage) params.stage = filters.stage;
      if (filters.sort) params.sort = filters.sort;
      if (filters.order) params.order = filters.order;
      const { data } = await api.get<{ patients: Patient[] }>('/api/patients', { params });
      return data.patients;
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get<Patient>(`/api/patients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePatientInput) => {
      const { data } = await api.post<Patient>('/api/patients', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreatePatientInput> & { id: string }) => {
      const { data } = await api.patch<Patient>(`/api/patients/${id}`, input);
      return data;
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/patients/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.removeQueries({ queryKey: ['patient', id] });
    },
  });
}
