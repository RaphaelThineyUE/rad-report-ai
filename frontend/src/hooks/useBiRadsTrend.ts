import { useMemo } from 'react';
import type { Report } from './useReports';
import type { BiRadsDataPoint } from '@/components/analytics';

/**
 * Hook to compute BI-RADS trend data from a list of reports.
 * Extracts and normalizes BI-RADS values from completed reports,
 * sorted chronologically for sparkline visualization.
 *
 * @param reports - Array of Report objects
 * @returns Array of BiRadsDataPoint objects sorted by date
 */
export function useBiRadsTrend(reports: Report[] | undefined): BiRadsDataPoint[] {
  return useMemo(() => {
    if (!reports || !reports.length) {
      return [];
    }

    const completed = reports
      .filter(r => r.status === 'completed' && r.birads_value)
      .map(r => ({
        date: r.created_at,
        value: r.birads_value as number,
        label: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return completed;
  }, [reports]);
}
