import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const GENDERS = ['Male', 'Female', 'Other'] as const;
export const CANCER_STAGES = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'] as const;
export const BIOMARKER_STATUSES = ['Positive', 'Negative', 'Unknown'] as const;

export type Gender = (typeof GENDERS)[number];
export type CancerStage = (typeof CANCER_STAGES)[number];
export type BiomarkerStatus = (typeof BIOMARKER_STATUSES)[number];

export interface Patient {
  id: string;
  created_by: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender | null;
  ethnicity: string | null;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage: CancerStage | null;
  tumor_size_cm: number | null;
  lymph_node_positive: boolean | null;
  er_status: BiomarkerStatus | null;
  pr_status: BiomarkerStatus | null;
  her2_status: BiomarkerStatus | null;
  menopausal_status: string | null;
  initial_treatment_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientInput {
  full_name: string;
  date_of_birth: string;
  gender?: Gender | null;
  ethnicity?: string | null;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage?: CancerStage | null;
  tumor_size_cm?: number | null;
  lymph_node_positive?: boolean | null;
  er_status?: BiomarkerStatus | null;
  pr_status?: BiomarkerStatus | null;
  her2_status?: BiomarkerStatus | null;
  menopausal_status?: string | null;
  initial_treatment_plan?: string | null;
}

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data } = await api.get<{ patients: Patient[] }>('/api/patients');
      return data.patients;
    },
  });
}

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<Patient>(`/api/patients/${patientId}`);
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientInput) => {
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
    mutationFn: async ({ id, ...input }: Partial<PatientInput> & { id: string }) => {
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
