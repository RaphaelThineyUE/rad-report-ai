/**
 * useConsolidation — TanStack Query hook for consolidating multiple patient reports.
 * Props: patientId (string), enabled (boolean) — controls when the query runs.
 * Queries /api/ai/consolidate with the patient_id.
 * Returns: useQuery result with ConsolidationData (overall_summary, key_trends, overall_birads, timeline, etc).
 * Used by Timeline visualization to display multi-report history chronologically.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TimelinePoint {
  exam_date: string | null;
  modality: string | null;
  birads: number | null;
  key_change: string;
}

export interface ConsolidationData {
  patient_id: string;
  report_count: number;
  consolidation: {
    overall_summary: string;
    key_trends: string[];
    overall_birads: number;
    clinical_implications: string;
    timeline: TimelinePoint[];
    pathology_correlation: string | null;
    clinical_disclaimer: string;
  };
}

export function useConsolidation(patientId: string, enabled: boolean = true) {
  return useQuery<ConsolidationData, Error>({
    queryKey: ['consolidation', patientId],
    queryFn: async () => {
      const response = await api.post<ConsolidationData>('/api/ai/consolidate', {
        patient_id: patientId,
      });
      return response.data;
    },
    enabled: enabled && !!patientId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
