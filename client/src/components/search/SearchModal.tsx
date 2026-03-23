import { ClearRounded, SearchRounded } from '@mui/icons-material';
import {
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  DocumentSchema,
  SearchParams,
  SearchResponseHit,
} from 'typesense';

import { getTypesenseClient } from 'hooks/useAlgolia';
import { useDebounce } from 'hooks/utils';
import { noop } from 'modules/utils';
import { Hit } from './Hit';
import type { SearchCollectionConfig, SearchProps } from './Search';

type SearchModalHit = Record<string, any> & {
  id: string;
  objectID: string;
  collectionName: string;
  searchTitle: string;
  searchSubtitle?: string;
};

type SearchModalSection = SearchCollectionConfig & {
  items: SearchModalHit[];
};

export type SearchModalProps = SearchProps & {
  onClose?: () => void;
};

const DEFAULT_QUERY_BY = 'searchTitle,searchSubtitle';
const DEFAULT_PER_PAGE = 8;

export function SearchModal({
  apiKey,
  indexName,
  indexTitle,
  collections,
  searchParameters,
  hitComponent = Hit,
  placeholder = 'Search records',
  onClose = noop,
  onSelect,
  transformItems,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [sections, setSections] = useState<SearchModalSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const debouncedQuery = useDebounce(query, 150);

  const client = useMemo(
    () =>
      getTypesenseClient({
        node: import.meta.env.VITE_TYPESENSE_NODE,
        port: parseInt(import.meta.env.VITE_TYPESENSE_PORT),
        protocol: import.meta.env.VITE_TYPESENSE_PROTOCOL,
        apiKey,
      }),
    [apiKey],
  );

  const searchCollections = useMemo(() => {
    if (collections && collections.length > 0) {
      return collections;
    }

    if (!indexName || !indexTitle) {
      return [];
    }

    return [
      {
        indexName,
        indexTitle,
        searchParameters,
      },
    ];
  }, [collections, indexName, indexTitle, searchParameters]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function runSearch() {
      const trimmedQuery = debouncedQuery.trim();

      if (!trimmedQuery) {
        setSections([]);
        setIsLoading(false);
        setIsError(false);
        return;
      }

      if (searchCollections.length === 0) {
        setSections([]);
        setIsLoading(false);
        setIsError(true);
        return;
      }

      setIsLoading(true);
      setIsError(false);

      const results = await Promise.all(
        searchCollections.map(async (collection) => {
          try {
            const mergedParams = {
              ...searchParameters,
              ...collection.searchParameters,
              q: trimmedQuery,
              page: 1,
              per_page:
                collection.searchParameters?.per_page ??
                searchParameters?.per_page ??
                DEFAULT_PER_PAGE,
              query_by:
                collection.searchParameters?.query_by ??
                searchParameters?.query_by ??
                DEFAULT_QUERY_BY,
              highlight_start_tag: '<mark>',
              highlight_end_tag: '</mark>',
            } as SearchParams<DocumentSchema, string>;

            const response = await client
              .collections(collection.indexName)
              .documents()
              .search(mergedParams);

            const normalizedItems = (response.hits ?? []).map((hit) =>
              normalizeHit(collection.indexName, hit),
            );

            const items = transformItems
              ? (transformItems(normalizedItems) as SearchModalHit[])
              : normalizedItems;

            return {
              ...collection,
              items,
              error: null,
            };
          } catch (error) {
            return {
              ...collection,
              items: [],
              error,
            };
          }
        }),
      );

      if (ignore) {
        return;
      }

      setSections(results.filter((section) => section.items.length > 0));
      setIsLoading(false);
      setIsError(
        results.length > 0 &&
          results.every(
            (section) => section.items.length === 0 && section.error !== null,
          ),
      );
    }

    void runSearch();

    return () => {
      ignore = true;
    };
  }, [
    client,
    debouncedQuery,
    searchCollections,
    searchParameters,
    transformItems,
  ]);

  const HitComponent = hitComponent;

  return (
    <div className='aa-Autocomplete'>
      <DialogTitle className='DocSearch-SearchBar'>
        <form
          className='DocSearch-Form'
          onSubmit={(event) => {
            event.preventDefault();
          }}
          style={{ display: 'flex', alignItems: 'center', width: '100%' }}
        >
          <TextField
            autoFocus
            className='DocSearch-SearchBar'
            fullWidth
            inputRef={inputRef}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={placeholder}
            value={query}
            variant='standard'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchRounded fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    aria-label='clear'
                    disabled={!query}
                    onClick={() => {
                      setQuery('');
                    }}
                    title='clear'
                  >
                    <ClearRounded fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>
      </DialogTitle>

      <DialogContent
        dividers
        className='DocSearch-Dropdown'
        sx={{ py: '0 !important' }}
      >
        {!query.trim() && (
          <div className='DocSearch-StartScreen'>
            <p className='DocSearch-Help'>Start typing to search Typesense.</p>
          </div>
        )}

        {query.trim() && isLoading && (
          <div className='DocSearch-NoResults'>
            <CircularProgress size={24} />
          </div>
        )}

        {query.trim() && !isLoading && isError && (
          <div className='DocSearch-NoResults'>
            <Typography className='DocSearch-Title'>
              Search failed. Check your Typesense collections and query config.
            </Typography>
          </div>
        )}

        {query.trim() && !isLoading && !isError && sections.length === 0 && (
          <div className='DocSearch-NoResults'>
            <Typography className='DocSearch-Title'>
              No results for "<strong>{query}</strong>"
            </Typography>
          </div>
        )}

        {query.trim() && !isLoading && !isError && sections.length > 0 && (
          <div className='DocSearch-Dropdown-Container'>
            {sections.map((section) => (
              <section className='DocSearch-Hits' key={section.indexName}>
                <Typography
                  className='DocSearch-Hit-source'
                  color='primary'
                  fontWeight={600}
                  variant='subtitle2'
                >
                  {section.indexTitle}
                </Typography>

                <ul>
                  {section.items.map((item) => (
                    <li
                      className='DocSearch-Hit'
                      key={`${section.indexName}:${item.objectID}`}
                      onClick={(event) => {
                        if (onSelect) {
                          event.preventDefault();
                          event.stopPropagation();
                          onSelect(item);
                        }

                        onClose();
                      }}
                    >
                      <HitComponent hit={item}>
                        <div className='DocSearch-Hit-Container'>
                          <div className='DocSearch-Hit-content-wrapper'>
                            <Typography className='DocSearch-Hit-title'>
                              {item.searchTitle}
                            </Typography>
                            {item.searchSubtitle && (
                              <Typography className='DocSearch-Hit-path'>
                                {item.searchSubtitle}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </HitComponent>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </div>
  );
}

function normalizeHit(
  indexName: string,
  hit: SearchResponseHit<DocumentSchema>,
): SearchModalHit {
  const document = hit.document as Record<string, any>;
  const id = String(document.id ?? document.objectID ?? '');

  return {
    ...document,
    id,
    objectID: id,
    collectionName: document.collectionName ?? getCollectionName(indexName),
    searchTitle: String(
      document.searchTitle ?? document.displayName ?? document.orgName ?? id,
    ),
    searchSubtitle:
      typeof document.searchSubtitle === 'string'
        ? document.searchSubtitle
        : undefined,
  };
}

function getCollectionName(indexName: string) {
  const parts = indexName.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : indexName;
}
