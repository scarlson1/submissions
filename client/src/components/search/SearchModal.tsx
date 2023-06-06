// DOCS: https://www.algolia.com/doc/ui-libraries/autocomplete/guides/creating-a-renderer/
import React, { useMemo, useState } from 'react';
import { DialogContent, DialogTitle } from '@mui/material';
import algoliasearch from 'algoliasearch/lite';
import type { AutocompleteState } from '@algolia/autocomplete-core';
import { createAutocomplete } from '@algolia/autocomplete-core';
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia';

import type { InternalDocSearchHit, StoredDocSearchHit } from 'common';
import { createStoredSearches } from './storedSearches';
import { noop } from 'modules/utils';
import { SearchProps } from './Search';
import { SearchBox, SearchBoxTranslations } from './SearchBox';
import { ScreenState, ScreenStateTranslations } from './ScreenState';
import { Hit, getURLByType } from './Hit';
import type { FooterTranslations } from './Footer';
import { groupByCollectionName, identity } from './utils';

// TODO: use tages to filter results by collectionName when user clicks Chip
// https://www.algolia.com/doc/ui-libraries/autocomplete/guides/filtering-results/#adding-tags
// TODO: pass initial tag as filter when search button clicked in x grid view
// TODO: add predefined items (FAQ's, submit claim, etc.)

export type ModalTranslations = Partial<{
  searchBox: SearchBoxTranslations;
  footer: FooterTranslations;
}> &
  ScreenStateTranslations;

export type SearchModalProps = SearchProps & {
  // initialScrollY: number;
  onClose?: () => void;
  translations?: ModalTranslations;
};

export function SearchModal({
  appId,
  apiKey,
  indexName,
  indexTitle,
  hitComponent = Hit,
  resultsFooterComponent = () => null,
  disableUserPersonalization = false,
  placeholder = 'Search records',
  navigator,
  // initialQuery = '',
  translations = {},
  getMissingResultsUrl,
  onClose = noop,
  transformItems = identity,
}: SearchModalProps) {
  const {
    footer: footerTranslations,
    searchBox: searchBoxTranslations,
    ...screenStateTranslations
  } = translations;
  const [state, setState] = useState<AutocompleteState<InternalDocSearchHit>>({
    query: '',
    collections: [],
    completion: null,
    context: {},
    isOpen: false,
    activeItemId: null,
    status: 'idle',
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const formElementRef = React.useRef<HTMLDivElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  // const snippetLength = React.useRef<number>(10);

  const searchClient = useMemo(() => algoliasearch(appId, apiKey), [appId, apiKey]);

  const favoriteSearches = React.useRef(
    createStoredSearches<StoredDocSearchHit>({
      key: `__FAVORITE_SEARCHES__${indexName}`,
      limit: 10,
    })
  ).current;
  const recentSearches = React.useRef(
    createStoredSearches<StoredDocSearchHit>({
      key: `__RECENT_SEARCHES__${indexName}`,
      // We display 7 recent searches and there's no favorites, but only
      // 4 when there are favorites.
      limit: favoriteSearches.getAll().length === 0 ? 7 : 4,
    })
  ).current;

  const saveRecentSearch = React.useCallback(
    (item: InternalDocSearchHit) => {
      if (disableUserPersonalization) {
        return;
      }

      // Don't store `content` record, but their parent if available.
      const search = item.type === 'content' ? item.__docsearch_parent : item;

      // Save the recent search only if it's not favorited.
      if (
        search &&
        favoriteSearches.getAll().findIndex((x) => x.objectID === search.objectID) === -1
      ) {
        recentSearches.add(search);
      }
    },
    [favoriteSearches, recentSearches, disableUserPersonalization]
  );

  const autocomplete = useMemo(
    () =>
      createAutocomplete<
        InternalDocSearchHit,
        React.FormEvent<HTMLFormElement>,
        React.MouseEvent,
        React.KeyboardEvent
      >({
        id: 'search-autocomplete',
        defaultActiveItemId: 0,
        placeholder,
        openOnFocus: true,
        initialState: {
          query: '', // initialQuery,
          context: {
            searchSuggestions: [],
          },
        },
        navigator,
        onStateChange(props) {
          setState(props.state);
        },
        // plugins: [predefinedItemsPlugin],
        // DOCS IMPLEMENTATION
        // @ts-ignore // TODO: fix type
        getSources({ query, state: sourcesState, setContext, setStatus }) {
          if (!query) {
            if (disableUserPersonalization) {
              return [];
            }

            return [
              {
                sourceId: 'recentSearches',
                onSelect({ item, event }) {
                  saveRecentSearch(item);

                  // if (!isModifierEvent(event)) { // TODO: create helper func
                  //   onClose();
                  // }
                  onClose();
                },
                getItemUrl({ item, ...rest }) {
                  // TODO: getItemUrl func
                  // item.__autocomplete_indexName
                  // but need to use "type" when indexing in algolia b/c could be in suggestions index
                  // console.log('GET ITEM URL ITEM: ', item);
                  // console.log('GET ITEM URL REST: ', rest); // @ts-ignore
                  // console.log('INDEX NAME: ', item.__autocomplete_indexName);
                  // @ts-ignore
                  if (item.__autocomplete_indexName) return 'https://google.com'; // TODO: fix
                  return item.url;
                },
                getItems() {
                  return recentSearches.getAll();
                },
              },
              {
                sourceId: 'favoriteSearches',
                onSelect({ item, event }) {
                  saveRecentSearch(item);

                  // if (!isModifierEvent(event)) {
                  //   onClose();
                  // }
                  onClose();
                },
                getItemUrl({ item }) {
                  // TODO: getItemUrl func
                  return item.url;
                },
                getItems() {
                  return favoriteSearches.getAll();
                },
              },
            ];
          }

          return [
            // (3) Use an Algolia index source.
            {
              sourceId: indexName,
              title: indexTitle, // indexName.split('_').join(' '),
              distinct: 1,
              getItemInputValue({ item }) {
                // @ts-ignore
                return item.query;
              },
              getItems({ query }) {
                return getAlgoliaResults({
                  searchClient,
                  queries: [
                    {
                      indexName,
                      query,
                      params: {
                        hitsPerPage: 10,
                        highlightPreTag: '<mark>',
                        highlightPostTag: '</mark>',
                      },
                    },
                  ],
                });
              },
              getItemUrl({ item }) {
                // called when item is hovered
                return getURLByType(item);
                // return item.url;
              },
              onSelect({ item, event }) {
                saveRecentSearch(item);

                // if (!isModifierEvent(event)) { // TODO: isModifierEvent helper func
                onClose();
                // }
              },
              templates: {
                header() {
                  return 'Test title';
                },
              },
            },
          ];
        },
        // @ts-ignore
        reshape(params: {
          sources: any[];
          sourcesBySourceId: Record<string, any>;
          state: AutocompleteState<InternalDocSearchHit>;
        }) {
          const { recentSearches, ...rest } = params.sourcesBySourceId;
          const searchSource = params.sourcesBySourceId[indexName];

          if (!searchSource) return [Object.values(rest)];

          return [groupByCollectionName(searchSource)]; //  Object.values(rest)
          // including Object.values(rest) results in duplicates (add and use dedup func ??)

          // const items = searchSource.getItems();
          // const groupByResult = groupByOld(items, (item: any) => item.type, 4);
          // return [removeDuplicates(recentSearches), Object.values(rest)];

          // multiple reshape functions example:
          // return [
          //   limitSuggestions(removeDuplicates(recentSearchesPlugin, querySuggestionsPlugin)),
          //   Object.values(rest),
          // ];
        },

        // DOCSEARCH IMPLEMENTATION
        // https://github.com/algolia/docsearch/blob/main/packages/docsearch-react/src/DocSearchModal.tsx
      }),
    [
      indexName,
      indexTitle,
      // searchParameters,
      searchClient,
      onClose,
      recentSearches,
      favoriteSearches,
      saveRecentSearch,
      // initialQuery,
      placeholder,
      navigator,
      // transformItems,
      disableUserPersonalization,
    ]
  );

  // TODO: add stalled state indicator: https://www.algolia.com/doc/ui-libraries/autocomplete/guides/creating-a-renderer/#reacting-to-the-network
  return (
    <div ref={containerRef} className='aa-Autocomplete' {...autocomplete.getRootProps({})}>
      <div ref={modalRef}>
        {/* className='DocSearch-Modal' */}
        <DialogTitle className='DocSearch-SearchBar' ref={formElementRef}>
          <SearchBox
            {...autocomplete}
            state={state}
            autoFocus={true} // {initialQuery.length === 0}
            inputRef={inputRef}
            // isFromSelection={
            //   Boolean(initialQuery) &&
            //   initialQuery === initialQueryFromSelection
            // }
            // translations={searchBoxTranslations}
            onClose={onClose}
          />
        </DialogTitle>
        <DialogContent
          dividers
          className='DocSearch-Dropdown'
          ref={dropdownRef}
          sx={{
            py: '0 !important',
          }}
          // sx={{
          //   maxHeight:
          //     'calc(var(--docsearch-vh, 1vh) * 100) - var(--docsearch-searchbox-height) - var(--docsearch-spacing) - var(--docsearch-footer-height)',
          // }}
        >
          <ScreenState
            {...autocomplete}
            indexName={indexName}
            state={state}
            hitComponent={hitComponent}
            resultsFooterComponent={resultsFooterComponent}
            disableUserPersonalization={disableUserPersonalization}
            recentSearches={recentSearches}
            favoriteSearches={favoriteSearches}
            inputRef={inputRef}
            translations={screenStateTranslations}
            getMissingResultsUrl={getMissingResultsUrl}
            onItemClick={(item, event) => {
              saveRecentSearch(item);
              // if (!isModifierEvent(event)) {
              //   onClose();
              // }
            }}
          />
        </DialogContent>
      </div>
    </div>
  );
}
