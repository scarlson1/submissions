import { QueryCache, QueryClient } from '@tanstack/react-query';

const queryCache = new QueryCache();
export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 20,
      // suspense: true,
    },
    mutations: {
      // mutation options
    },
  },
});
