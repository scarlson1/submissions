import {
  SearchOptions as AlgoliaSearchOptions,
  Hit,
} from '@algolia/client-search';
import algoliasearch from 'algoliasearch';

// src: https://tanstack.com/query/latest/docs/react/examples/react/algolia

// From Algolia example
// https://github.com/algolia/react-instantsearch
// const ALGOLIA_APP_ID = 'latency';
// const ALGOLIA_SEARCH_API_KEY = '6be0576ff61c053d5f9a3225e2a90f76';
const ALGOLIA_APP_ID = import.meta.env.VITE_TYPESENSE_NODE; // VITE_ALGOLIA_APP_ID;

// type SearchOptions2 = {
//   indexName: string;
//   query: string;
//   pageParam: number;
//   hitsPerPage: number;
// };

export interface SearchOptions extends AlgoliaSearchOptions {
  indexName: string;
  query: string;
  pageParam: number;
  hitsPerPage: number;
  apiKey: string;
}

export async function search<TData>({
  indexName,
  query,
  pageParam = 0,
  hitsPerPage = 10,
  apiKey,
  ...rest
}: SearchOptions): Promise<{
  hits: Hit<TData>[];
  nextPage: number | undefined;
}> {
  if (!ALGOLIA_APP_ID)
    throw new Error('missing algolia appID in env variables');

  const client = algoliasearch(ALGOLIA_APP_ID, apiKey);
  const index = client.initIndex(indexName);

  console.log('algolia:search', { indexName, query, pageParam, hitsPerPage });

  const { hits, page, nbPages } = await index.search<TData>(query, {
    page: pageParam,
    hitsPerPage,
    ...rest,
  });

  const nextPage = page + 1 < nbPages ? page + 1 : undefined;

  return { hits, nextPage };
}
