import './search.css';

import React from 'react';
import { Button, Dialog, DialogActions, DialogProps } from '@mui/material';
import type { AutocompleteState, AutocompleteOptions } from '@algolia/autocomplete-core';
import type { SearchOptions } from '@algolia/client-search';
import type { SearchClient } from 'algoliasearch/lite';

import { SearchButton } from './SearchButton';
import type { DocSearchHit, InternalDocSearchHit, StoredDocSearchHit } from 'common';
import { SearchModal } from './SearchModal';

// export interface DocSearchProps {
//   appId: string;
//   apiKey: string;
//   indexName: string;
//   placeholder?: string;
//   searchParameters?: SearchOptions;
//   transformItems?: (items: DocSearchHit[]) => DocSearchHit[];
//   hitComponent?: (props: {
//     hit: InternalDocSearchHit | StoredDocSearchHit;
//     children: React.ReactNode;
//   }) => JSX.Element;
//   resultsFooterComponent?: (props: {
//     state: AutocompleteState<InternalDocSearchHit>;
//   }) => JSX.Element | null;
//   transformSearchClient?: (searchClient: SearchClient) => SearchClient;
//   disableUserPersonalization?: boolean;
//   initialQuery?: string;
//   navigator?: AutocompleteOptions<InternalDocSearchHit>['navigator'];
//   translations?: DocSearchTranslations;
//   getMissingResultsUrl?: ({ query }: { query: string }) => string;
// }

export interface SearchProps {
  appId: string;
  apiKey: string;
  indexName: string;
  placeholder?: string;
  searchParameters?: SearchOptions;
  transformItems?: (items: DocSearchHit[]) => DocSearchHit[];
  hitComponent?: (props: {
    hit: InternalDocSearchHit | StoredDocSearchHit;
    children: React.ReactNode;
  }) => JSX.Element;
  resultsFooterComponent?: (props: {
    state: AutocompleteState<InternalDocSearchHit>;
  }) => JSX.Element | null;
  transformSearchClient?: (searchClient: SearchClient) => SearchClient;
  disableUserPersonalization?: boolean;
  initialQuery?: string;
  navigator?: AutocompleteOptions<InternalDocSearchHit>['navigator'];
  // translations?: DocSearchTranslations;
  getMissingResultsUrl?: ({ query }: { query: string }) => string;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: DialogProps['fullWidth'];
}

export function Search({ maxWidth = 'sm', fullWidth = true, ...props }: SearchProps) {
  const searchButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [initialQuery, setInitialQuery] = React.useState<string | undefined>(
    props?.initialQuery || undefined
  );

  const onOpen = React.useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = React.useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);
  // useTrapFocus({ container: containerRef.current });

  // const onInput = React.useCallback(
  //   (event: KeyboardEvent) => {
  //     setIsOpen(true);
  //     setInitialQuery(event.key);
  //   },
  //   [setIsOpen, setInitialQuery]
  // );

  // useDocSearchKeyboardEvents({
  //   isOpen,
  //   onOpen,
  //   onClose,
  //   onInput,
  //   searchButtonRef,
  // });

  // TODO: place searchbox in dialog header, results in dialog conttent
  return (
    <>
      <SearchButton
        ref={searchButtonRef}
        // translations={props?.translations?.button}
        onClick={onOpen}
      />
      <Dialog fullWidth={fullWidth} maxWidth={maxWidth} open={isOpen} onClose={onClose}>
        {/* <DialogContent> */}
        <SearchModal
          {...props}
          initialQuery={initialQuery}
          onClose={onClose}
          // initialScrollY={window.scrollY}
          // translations={props?.translations?.modal}
        />
        {/* </DialogContent> */}
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
