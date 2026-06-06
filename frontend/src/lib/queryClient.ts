/**
 * Singleton TanStack Query client shared across the entire frontend.
 * Configured with a 60-second stale time and a single automatic retry per failed query.
 * Export: queryClient — passed to QueryClientProvider in the app root.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});
