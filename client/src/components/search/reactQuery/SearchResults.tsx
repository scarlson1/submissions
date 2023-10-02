import { SearchOptions } from '@algolia/client-search';
import { useAlgolia } from 'hooks/useAlgolia';

// TODO: hit component w/ collectionName icon
// render results in dropdown
// onSelect/onClick handler

type BaseHit = {
  searchTitle: string;
  searchSubtitle: string;
} & Record<string, any>;

// type SearchResultsProps = {
//   query: string;
// };
type SearchResultsProps = SearchOptions;

export function SearchResults({ query = '', ...props }: SearchResultsProps) {
  const { hits, isLoading, isFetching, status, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAlgolia<BaseHit>({
      // TODO: hit type
      // Product
      // indexName: 'best_buy',
      indexName: process.env.REACT_APP_ALGOLIA_INDEX_NAME as string,
      query,
      hitsPerPage: 5,
      staleTime: 1000 * 60, // 60s
      cacheTime: 1000 * 60 * 15, // 15m
      enabled: !!query,
      ...props,
    });

  if (!query) return null;

  if (isLoading) return <div className='loading'>Loading...</div>;

  return (
    <div>
      <div className='search-status'>
        Status: {status} {isFetching && <span>fetching...</span>}
      </div>
      <div>
        <div className='search-result'>
          {hits && hits.length > 0 ? (
            hits.map((hit) => (
              <li key={hit.objectID} className='product'>
                <span className='product-name'>{`[${hit.collectionName}] - ${hit.searchTitle}`}</span>
                {hit.searchSubtitle && (
                  <>
                    <br />
                    <span className='product-description'>{hit.searchSubtitle}</span>
                  </>
                )}
                <br />
                {/* <span className='product-price'>${hit.salePrice}</span> */}
              </li>
            ))
          ) : (
            <h3>No matches found!</h3>
          )}
        </div>
        {hasNextPage && (
          <div className='search-more' onClick={() => fetchNextPage()}>
            more
          </div>
        )}
        {isFetchingNextPage && <div className='search-status'>Fetching next page...</div>}
      </div>
    </div>
  );
}
