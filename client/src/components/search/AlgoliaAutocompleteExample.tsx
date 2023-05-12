// SOURCE: https://www.algolia.com/doc/ui-libraries/autocomplete/integrations/with-react-instantsearch-hooks/#using-autocomplete-as-a-search-box

import React, { useMemo } from 'react';
import { createElement, Fragment, useEffect, useRef, useState } from 'react';

import { usePagination, useSearchBox } from 'react-instantsearch-hooks';
import { autocomplete, AutocompleteOptions } from '@algolia/autocomplete-js';
import { BaseItem } from '@algolia/autocomplete-core';
import type { SearchClient } from 'algoliasearch/lite';
import { debounce } from '@algolia/autocomplete-shared';
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';

import '@algolia/autocomplete-theme-classic';
import { Typography } from '@mui/material';

// TODO: create useAutocomplete hook: https://www.algolia.com/doc/api-reference/widgets/autocomplete/react-hooks/

// DOC SEARCH SearchBox component: https://github.com/algolia/docsearch/blob/main/packages/docsearch-react/src/SearchBox.tsx

// DOC SEARCH modal component: https://github.com/algolia/docsearch/blob/main/packages/docsearch-react/src/DocSearchModal.tsx

type AutocompleteProps = Partial<AutocompleteOptions<BaseItem>> & {
  className?: string;
  searchClient: SearchClient;
};

type SetInstantSearchUiStateOptions = {
  query: string;
};

export function Autocomplete({ className, searchClient, ...autocompleteProps }: AutocompleteProps) {
  const autocompleteContainer = useRef<HTMLDivElement>(null);

  const { query, refine: setQuery } = useSearchBox();
  const { refine: setPage } = usePagination();

  const [instantSearchUiState, setInstantSearchUiState] = useState<SetInstantSearchUiStateOptions>({
    query,
  });
  const debouncedSetInstantSearchUiState = debounce(setInstantSearchUiState, 500);

  useEffect(() => {
    setQuery(instantSearchUiState.query);
    setPage(0);
  }, [instantSearchUiState]);

  const plugins = useMemo(() => {
    const recentSearches = createLocalStorageRecentSearchesPlugin({
      key: 'instantsearch',
      limit: 3,
      transformSource({ source }) {
        return {
          ...source,
          onSelect({ item }) {
            setInstantSearchUiState({ query: item.label });
          },
        };
      },
    });

    // TODO: create query suggestions index:  https://www.algolia.com/doc/guides/building-search-ui/ui-and-ux-patterns/query-suggestions/how-to/creating-a-query-suggestions-index/js/
    // TODO: use facet data until enough analytics data is collected
    const querySuggestions = createQuerySuggestionsPlugin({
      searchClient,
      indexName: 'local_tasks', // 'instant_search_query_suggestions_demo', // INSTANT_SEARCH_QUERY_SUGGESTIONS,
      getSearchParams() {
        return recentSearches.data!.getAlgoliaSearchParams({
          hitsPerPage: 6,
        });
      },
      transformSource({ source }) {
        return {
          ...source,
          sourceId: 'querySuggestionsPlugin',
          onSelect({ item }) {
            setInstantSearchUiState({ query: item.query });
          },
          getItems(params) {
            if (!params.state.query) {
              return [];
            }

            return source.getItems(params);
          },
        };
      },
    });

    return [recentSearches, querySuggestions];
    // const recentSearches = createLocalStorageRecentSearchesPlugin({
    //   key: 'instantsearch',
    //   limit: 3,
    //   transformSource({ source }) {
    //     return {
    //       ...source,
    //       onSelect({ item }) {
    //         setInstantSearchUiState({
    //           query: item.label,
    //           category: item.category,
    //         });
    //       },
    //     };
    //   },
    // });

    //   const querySuggestionsInCategory = createQuerySuggestionsPlugin({
    //     searchClient,
    //     indexName: INSTANT_SEARCH_QUERY_SUGGESTIONS,
    //     getSearchParams() {
    //       return recentSearches.data!.getAlgoliaSearchParams({
    //         hitsPerPage: 3,
    //         facetFilters: [
    //           `${INSTANT_SEARCH_INDEX_NAME}.facets.exact_matches.${INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0]}.value:${currentCategory}`,
    //         ],
    //       });
    //     },
    //     transformSource({ source }) {
    //       return {
    //         ...source,
    //         sourceId: 'querySuggestionsInCategoryPlugin',
    //         onSelect({ item }) {
    //           setInstantSearchUiState({
    //             query: item.query,
    //             category: item.__autocomplete_qsCategory,
    //           });
    //         },
    //         getItems(params) {
    //           if (!currentCategory) {
    //             return [];
    //           }

    //           return source.getItems(params);
    //         },
    //         templates: {
    //           ...source.templates,
    //           header({ items }) {
    //             if (items.length === 0) {
    //               return <Fragment />;
    //             }

    //             return (
    //               <Fragment>
    //                 <span className='aa-SourceHeaderTitle'>In {currentCategory}</span>
    //                 <span className='aa-SourceHeaderLine' />
    //               </Fragment>
    //             );
    //           },
    //         },
    //       };
    //     },
    //   });

    //   const querySuggestions = createQuerySuggestionsPlugin({
    //     searchClient,
    //     indexName: INSTANT_SEARCH_QUERY_SUGGESTIONS,
    //     getSearchParams() {
    //       if (!currentCategory) {
    //         return recentSearches.data!.getAlgoliaSearchParams({
    //           hitsPerPage: 6,
    //         });
    //       }

    //       return recentSearches.data!.getAlgoliaSearchParams({
    //         hitsPerPage: 3,
    //         facetFilters: [
    //           `${INSTANT_SEARCH_INDEX_NAME}.facets.exact_matches.${INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0]}.value:-${currentCategory}`,
    //         ],
    //       });
    //     },
    //     categoryAttribute: [
    //       INSTANT_SEARCH_INDEX_NAME,
    //       'facets',
    //       'exact_matches',
    //       INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0],
    //     ],
    //     transformSource({ source }) {
    //       return {
    //         ...source,
    //         sourceId: 'querySuggestionsPlugin',
    //         onSelect({ item }) {
    //           setInstantSearchUiState({
    //             query: item.query,
    //             category: item.__autocomplete_qsCategory || '',
    //           });
    //         },
    //         getItems(params) {
    //           if (!params.state.query) {
    //             return [];
    //           }

    //           return source.getItems(params);
    //         },
    //         templates: {
    //           ...source.templates,
    //           header({ items }) {
    //             if (!currentCategory || items.length === 0) {
    //               return <Fragment />;
    //             }

    //             return (
    //               <Fragment>
    //                 <span className='aa-SourceHeaderTitle'>In other categories</span>
    //                 <span className='aa-SourceHeaderLine' />
    //               </Fragment>
    //             );
    //           },
    //         },
    //       };
    //     },
    //   });

    //   return [recentSearches, querySuggestionsInCategory, querySuggestions];
  }, []);

  useEffect(() => {
    console.log('AUTO COMPLETE PROPS CHANGE');
    if (!autocompleteContainer.current) {
      return;
    }

    const autocompleteInstance = autocomplete({
      ...autocompleteProps,
      container: autocompleteContainer.current,
      initialState: { query },
      plugins,
      insights: true,
      onReset() {
        setInstantSearchUiState({ query: '' });
      },
      onSubmit({ state }) {
        setInstantSearchUiState({ query: state.query });
        // TODO: save search (algolia & google analytics)
      },
      onStateChange({ prevState, state }) {
        if (prevState.query !== state.query) {
          debouncedSetInstantSearchUiState({
            query: state.query,
          });
          // setInstantSearchUiState({
          //   query: state.query,
          // });
        }
      },
      renderer: { createElement, Fragment, render: () => {} },
      renderNoResults({ state, render }, root) {
        render(<Typography>{`No results for "${state.query}".`}</Typography>, root);
      },
      // TODO: use getAlgoliaResults (batches query calls)
      // https://www.algolia.com/doc/ui-libraries/autocomplete/api-reference/autocomplete-js/getAlgoliaResults/
    });

    return () => autocompleteInstance.destroy();
  }, [plugins]);

  return <div className={className} style={{ width: '100%' }} ref={autocompleteContainer} />;
}

// USAGE:

// export function App() {
//   return (
//     <div>
//       <InstantSearch searchClient={searchClient} indexName='instant_search' routing>
//         <header className='header'>
//           <div className='header-wrapper wrapper'>
//             <nav className='header-nav'>
//               <a href='/'>Home</a>
//             </nav>
//             <Autocomplete
//                placeholder = 'Search products';
//                detachedMediaQuery = 'none';
//                openOnFocus;
//             />
//           </div>
//         </header>
//         <div className='container wrapper'>
//           <div>
//             <RefinementList attribute='brand' />
//           </div>
//           <div>
//             <Hits hitComponent={Hit} />
//             <Pagination />
//           </div>
//         </div>
//       </InstantSearch>
//     </div>
//   );
// }
