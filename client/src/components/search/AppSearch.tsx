import { Collection } from '@idemand/common';
import { typesenseIndexName } from 'common';
import { useTypesenseStore } from 'hooks/useAlgoliaStore';
import type { SearchCollectionConfig } from './Search';
import { Search } from './Search';

const SEARCH_COLLECTIONS: SearchCollectionConfig[] = [
  {
    indexName: typesenseIndexName(Collection.enum.users),
    indexTitle: 'Users',
    searchParameters: {
      query_by:
        'displayName,firstName,lastName,email,searchTitle,searchSubtitle',
      per_page: 5,
    },
  },
  {
    indexName: typesenseIndexName(Collection.enum.organizations),
    indexTitle: 'Organizations',
    searchParameters: {
      query_by: 'orgName,searchTitle,searchSubtitle',
      per_page: 5,
    },
  },
  {
    indexName: typesenseIndexName(Collection.enum.submissions),
    indexTitle: 'Submissions',
    searchParameters: {
      query_by: 'searchTitle,searchSubtitle',
      per_page: 5,
    },
  },
  {
    indexName: typesenseIndexName(Collection.enum.quotes),
    indexTitle: 'Quotes',
    searchParameters: {
      query_by: 'searchTitle,searchSubtitle',
      per_page: 5,
    },
  },
  {
    indexName: typesenseIndexName(Collection.enum.policies),
    indexTitle: 'Policies',
    searchParameters: {
      query_by: 'searchTitle,searchSubtitle',
      per_page: 5,
    },
  },
];

export function AppSearch() {
  const apiKey = useTypesenseStore((state) => state.apiKey);

  if (!apiKey) return null;

  return (
    <Search
      apiKey={apiKey}
      collections={SEARCH_COLLECTIONS}
      placeholder='Search...'
    />
  );
}
