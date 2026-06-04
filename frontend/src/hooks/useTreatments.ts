import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Treatment } from '../types/domain';

export const useTreatments = (patientId?: string) =>
  useQuery({
    queryKey: ['treatments', patientId],
    queryFn: async () => {
      const { data } = await api.get<{ treatments: Treatment[] }>('/api/treatments', {
        params: patientId ? { patient_id: patientId } : undefined,
      });
      return data.treatments;
    },
  });
