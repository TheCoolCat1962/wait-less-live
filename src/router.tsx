import { QueryClient, QueryClientConfig } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Default QueryClient configuration optimized for mobile performance
// - refetchOnFocus: Disabled to prevent unnecessary network requests when tab becomes visible
// - refetchOnReconnect: Disabled to prevent unnecessary refetches when network reconnects
// - retry: Limited to 1 retry to fail fast and show error states quickly
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Don't refetch when window regains focus - stale data is acceptable for wait times
      refetchOnFocus: false,
      // Don't refetch when network reconnects - let user manually refresh if needed
      refetchOnReconnect: false,
      // Don't refetch when window visibility changes
      refetchOnWindowFocus: false,
      // Retry only once to fail fast
      retry: 1,
      // Keep failed queries in cache for 30 seconds to show error state
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
};

export const getRouter = () => {
  const queryClient = new QueryClient(queryClientConfig);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
