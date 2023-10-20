import { SearchOptions } from '@algolia/client-search';
import { useInfiniteQuery } from '@tanstack/react-query';

import { search } from 'components/search/reactQuery';
import { useAlgoliaStore } from './useAlgoliaStore';

// export type UseAlgoliaOptions = {
//   indexName: string;
//   query: string;
//   hitsPerPage?: number;
//   staleTime?: number;
//   cacheTime?: number;
//   enabled?: boolean;
//   // searchOptions:
// };

export interface UseAlgoliaOptions extends SearchOptions {
  indexName: string;
  query: string;
  hitsPerPage?: number;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
}

export function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  gcTime,
  enabled,
  // filters,
  ...props
}: UseAlgoliaOptions) {
  const apiKey = useAlgoliaStore((state) => state.apiKey);
  if (!apiKey) throw new Error('missing search api key');

  const queryInfo = useInfiniteQuery({
    queryKey: ['algolia', indexName, query, hitsPerPage, props?.filters || ''],
    queryFn: ({ pageParam }) =>
      search<TData>({ indexName, query, pageParam, hitsPerPage, apiKey, ...props }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime,
    gcTime,
    enabled,
    // suspense: false, // https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#new-hooks-for-suspense
  });

  const hits = queryInfo.data?.pages.map((page) => page.hits).flat();

  return { ...queryInfo, hits };
}
