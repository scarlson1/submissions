import { SearchOptions } from '@algolia/client-search';
import { ChangeEvent, Suspense, useCallback, useState } from 'react';

import { useDebounce } from 'hooks/utils';
import { SearchResults } from './SearchResults';

// filter users ex: filters: 'collectionName:users',
type SearchProps = Omit<SearchOptions, 'query'>;

export default function Search(props: SearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce<string>(query, 100);

  const handleOnChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setQuery(event.target.value);
  }, []);

  return (
    <div>
      <input onChange={handleOnChange} value={query} placeholder='Search products' />
      <Suspense fallback={(() => 'loading...')()}>
        <SearchResults query={debouncedQuery} {...props} />
      </Suspense>
    </div>
  );
}
