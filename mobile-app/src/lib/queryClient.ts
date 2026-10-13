import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/types/api.types';

/** One QueryClient for the whole app (also cleared on logout) */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx errors (404, validation, permission) will not fix themselves — don't retry them
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 60_000, // feeds: 60s (screens override where needed)
      refetchOnWindowFocus: true, // "focus" = app returns to the foreground (see root layout)
    },
    mutations: { retry: false },
  },
});

/** Stale times used across screens (Prompt 49) */
export const STALE = {
  feed: 60_000,
  listing: 30_000,
  profile: 5 * 60_000,
} as const;
