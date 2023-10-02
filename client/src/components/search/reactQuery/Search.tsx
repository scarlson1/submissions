import { SearchOptions } from '@algolia/client-search';
import { ChangeEvent, useState } from 'react';

import { useDebounce } from 'hooks/utils';
import { SearchResults } from './SearchResults';

// filter users ex: filters: 'collectionName:users',
type SearchProps = Omit<SearchOptions, 'query'>;

export default function Search(props: SearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce<string>(query, 100);

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    // It is recommended to debounce this event in prod
    setQuery(event.target.value);
  };

  return (
    <div>
      <input onChange={handleOnChange} value={query} placeholder='Search products' />
      <SearchResults query={debouncedQuery} {...props} />
    </div>
  );
}
