import { SearchOptions } from '@algolia/client-search';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Client, type DocumentSchema, type SearchParams } from 'typesense';

import { search } from 'components/search/reactQuery';
import { useAlgoliaStore, useTypesenseStore } from './useAlgoliaStore';

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
  ...props
}: UseAlgoliaOptions) {
  const apiKey = useAlgoliaStore((state) => state.apiKey);
  if (!apiKey) throw new Error('missing search api key');

  const queryInfo = useInfiniteQuery({
    queryKey: ['algolia', indexName, query, hitsPerPage, props?.filters || ''],
    queryFn: ({ pageParam }) =>
      search<TData>({
        indexName,
        query,
        pageParam,
        hitsPerPage,
        apiKey,
        ...props,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime,
    gcTime,
    enabled,
  });

  return useMemo(() => {
    const hits = queryInfo.data?.pages.map((page) => page.hits).flat();
    return { ...queryInfo, hits };
  }, [queryInfo]);
}

export interface TypesenseCreds {
  name?: string;
  node: string;
  port: number;
  protocol: string;
  apiKey: string;
}

export function getTypesenseClient(creds: TypesenseCreds) {
  return new Client({
    nodes: [
      {
        host: creds.node,
        port: creds.port,
        protocol: creds.protocol,
      },
    ],
    apiKey: creds.apiKey,
  });
}

type TypesenseSearchParams<T extends DocumentSchema> = SearchParams<T>;

export type UseTypesenseOptions<T extends DocumentSchema> =
  TypesenseSearchParams<T> & {
    indexName: string;
    query: string;
    limit?: number;
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
  };

export const useTypesenseClient = (apiKey: string) =>
  getTypesenseClient({
    node: import.meta.env.VITE_TYPESENSE_NODE,
    port: parseInt(import.meta.env.VITE_TYPESENSE_PORT),
    protocol: import.meta.env.VITE_TYPESENSE_PROTOCOL,
    apiKey,
  });

export function useTypesense<TData extends DocumentSchema>({
  indexName,
  query,
  limit = 5,
  staleTime,
  gcTime,
  enabled,
  ...props
}: UseTypesenseOptions<TData>) {
  const apiKey = useTypesenseStore((state) => state.apiKey);
  if (!apiKey) throw new Error('missing search api key');

  const client = useTypesenseClient(apiKey);

  // useQuery or useInfiniteQuery ??
  const queryInfo = useInfiniteQuery({
    queryKey: [
      'typesense',
      indexName,
      query,
      limit,
      props?.query_by || '',
      // props?.filters || '',
    ],
    queryFn: ({ pageParam }) => {
      return client
        .collections<TData>(indexName)
        .documents()
        .search({
          ...props,
          q: query,
          page: pageParam,
          per_page: limit,
        });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const lastPageHitCount = lastPage.hits?.length ?? 0;
      return lastPageHitCount < limit ? undefined : lastPage.page + 1;
    },
    staleTime,
    gcTime,
    enabled,
  });

  return useMemo(() => {
    const hits = queryInfo.data?.pages.flatMap((page) => page.hits ?? []);
    return { ...queryInfo, hits };
  }, [queryInfo]);
}
