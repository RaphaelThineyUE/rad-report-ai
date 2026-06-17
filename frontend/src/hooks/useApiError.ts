/**
 * Hook for handling API errors in TanStack Query hooks and displaying them as notifications.
 * Features:
 * - Extracts user-friendly error messages from API responses
 * - Handles unified backend error format: { error: { code, message, details } }
 * - Fallback to generic error message for unexpected formats
 * - Provides mutationFn wrapper to automatically display errors
 * - Usage: const { handleError, wrapMutation } = useApiError();
 */
import { useNotification } from '@/contexts/NotificationContext';
import type { AxiosError } from 'axios';

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: string;
  };
}

export function useApiError() {
  const { addNotification } = useNotification();

  /**
   * Extracts a user-friendly error message from an API error response.
   * Returns the backend-provided message, or a generic fallback.
   */
  const getErrorMessage = (error: unknown): string => {
    if (!error) {
      return 'An unexpected error occurred. Please try again.';
    }

    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Check for unified backend error format
    if (axiosError.response?.data?.error?.message) {
      return axiosError.response.data.error.message;
    }

    // Fallback to generic HTTP status message
    if (axiosError.message) {
      return axiosError.message;
    }

    return 'An unexpected error occurred. Please try again.';
  };

  /**
   * Handles an error by logging it and displaying a notification.
   * Optional showNotification param allows suppressing the notification.
   */
  const handleError = (error: unknown, message?: string, showNotification = true) => {
    const errorMsg = message || getErrorMessage(error);

    if (showNotification) {
      addNotification(errorMsg, 'error', 6000);
    }

    // Log full error in development for debugging
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }

    return errorMsg;
  };

  /**
   * Wraps a mutation function to automatically handle and display errors.
   * The wrapped function will still throw the error after displaying a notification.
   */
  const wrapMutation = <T>(
    mutationFn: () => Promise<T>,
    errorMessage?: string
  ): (() => Promise<T>) => {
    return async () => {
      try {
        return await mutationFn();
      } catch (error) {
        handleError(error, errorMessage, true);
        throw error;
      }
    };
  };

  return {
    getErrorMessage,
    handleError,
    wrapMutation,
  };
}
