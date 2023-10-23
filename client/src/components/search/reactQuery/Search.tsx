import { Hit, SearchOptions } from '@algolia/client-search';
import { TextField } from '@mui/material';
import { ChangeEvent, Suspense, useCallback, useState } from 'react';

import { useDebounce } from 'hooks/utils';
import { BaseHit, SearchResults } from './SearchResults';

// filter users ex: filters: 'collectionName:users',
type SearchProps = Omit<SearchOptions, 'query'> & { onSelect: (item: Hit<BaseHit>) => void };

export default function Search(props: SearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce<string>(query, 100);

  const handleOnChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setQuery(event.target.value);
  }, []);

  return (
    <div>
      <TextField onChange={handleOnChange} value={query} placeholder='Search records' />
      <Suspense fallback={(() => 'loading...')()}>
        <SearchResults query={debouncedQuery} {...props} />
      </Suspense>
    </div>
  );
}
