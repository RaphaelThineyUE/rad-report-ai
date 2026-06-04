import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const TREATMENT_TYPES = [
  'Surgery',
  'Chemotherapy',
  'Radiation',
  'Hormone Therapy',
  'Targeted Therapy',
  'Immunotherapy',
  'Other',
] as const;

export const TREATMENT_OUTCOMES = [
  'Complete Response',
  'Partial Response',
  'Stable Disease',
  'Progressive Disease',
  'Recurrence',
  'Remission',
  'Other',
] as const;

export type TreatmentType = (typeof TREATMENT_TYPES)[number];
export type TreatmentOutcome = (typeof TREATMENT_OUTCOMES)[number];

export interface Treatment {
  id: string;
  created_by: string;
  patient_id: string;
  treatment_type: TreatmentType;
  treatment_start_date: string;
  treatment_end_date: string | null;
  medication_details: string | null;
  treatment_outcome: TreatmentOutcome | null;
  side_effects: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentInput {
  patient_id: string;
  treatment_type: TreatmentType;
  treatment_start_date: string;
  treatment_end_date?: string;
  medication_details?: string;
  treatment_outcome?: TreatmentOutcome;
  side_effects?: string;
  follow_up_date?: string;
}

export function useTreatments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['treatments', patientId],
    queryFn: async () => {
      const { data } = await api.get<{ treatments: Treatment[] }>('/api/treatments', {
        params: { patient_id: patientId },
      });
      return data.treatments;
    },
    enabled: !!patientId,
  });
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TreatmentInput) => {
      const { data } = await api.post<Treatment>('/api/treatments', input);
      return data;
    },
    onSuccess: (treatment) => {
      queryClient.invalidateQueries({ queryKey: ['treatments', treatment.patient_id] });
    },
  });
}

export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<TreatmentInput> & { id: string; patient_id: string }) => {
      const { data } = await api.patch<Treatment>(`/api/treatments/${id}`, input);
      return data;
    },
    onSuccess: (treatment) => {
      queryClient.invalidateQueries({ queryKey: ['treatments', treatment.patient_id] });
    },
  });
}

export function useDeleteTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patientId }: { id: string; patientId: string }) => {
      await api.delete(`/api/treatments/${id}`);
      return { patientId };
    },
    onSuccess: ({ patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['treatments', patientId] });
    },
  });
}
