/**
 * Hooks for triggering backend-generated file exports via browser navigation.
 * Each hook returns a stable callback that redirects window.location.href to the
 * appropriate backend export endpoint, causing the browser to download the file.
 * Exports: useExportReport, useExportPatient, useExportAnalytics.
 */
import { useCallback } from 'react';

export function useExportReport() {
  return useCallback(async (reportId: string) => {
    try {
      window.location.href = `/api/reports/${reportId}/export`;
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }, []);
}

export function useExportPatient() {
  return useCallback(async (patientId: string) => {
    try {
      window.location.href = `/api/patients/${patientId}/export`;
    } catch (error) {
      console.error('Failed to export patient:', error);
      throw error;
    }
  }, []);
}

export function useExportAnalytics() {
  return useCallback(async (filters?: Record<string, string>) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      window.location.href = `/api/analytics/export/csv?${params.toString()}`;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw error;
    }
  }, []);
}
