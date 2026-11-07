import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Never retry 401, 403, or 404 errors
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});
