import './search.css';

import React, { useEffect, useCallback } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogProps,
  GlobalStyles,
  Typography,
  alpha,
} from '@mui/material';
import type { AutocompleteState, AutocompleteOptions } from '@algolia/autocomplete-core';
import type { SearchOptions } from '@algolia/client-search';
import type { SearchClient } from 'algoliasearch/lite';

import type { DocSearchHit, InternalDocSearchHit, StoredDocSearchHit } from 'common';
import { SearchButton } from './SearchButton';
import { SearchModal } from './SearchModal';
import { useChangeTheme } from 'modules/components';
import { useAlgoliaSearchKey, useDocSearchKeyboardEvents } from 'hooks';
import { GeoSearch } from './GeoSearch';

const FADE_DURATION = 100;

export interface SearchProps {
  appId: string;
  apiKey: string;
  indexName: string;
  indexTitle: string;
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
  // initialQuery?: string;
  navigator?: AutocompleteOptions<InternalDocSearchHit>['navigator'];
  // translations?: DocSearchTranslations;
  getMissingResultsUrl?: ({ query }: { query: string }) => string;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: DialogProps['fullWidth'];
}

export function Search({ maxWidth = 'sm', fullWidth = true, ...props }: SearchProps) {
  const searchButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const { mode } = useChangeTheme();

  useEffect(() => {
    // TODO: just move to ThemeContext ?? set attribute in toggleTheme() ??
    // https://www.algolia.com/doc/ui-libraries/autocomplete/api-reference/autocomplete-theme-classic/#dark-mode
    const bodyRef = window.document.getElementsByTagName('body');
    if (bodyRef && bodyRef.length && bodyRef[0].getAttribute('data-theme') !== mode) {
      console.log('SETTING "data-theme": ', mode);
      bodyRef[0].setAttribute('data-theme', mode);
    }
  }, [mode]);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);
  // useTrapFocus({ container: containerRef.current });

  const onInput = useCallback(
    (event: KeyboardEvent) => {
      setIsOpen(true);
      // setInitialQuery(event.key);
    },
    [setIsOpen]
  );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  });

  return (
    <>
      <SearchButton
        ref={searchButtonRef}
        // translations={props?.translations?.button}
        onClick={onOpen}
      />
      <Dialog
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        open={isOpen}
        onClose={onClose}
        scroll='paper'
        slots={{
          backdrop: Backdrop,
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
            },
          },
        }}
        sx={{
          '.MuiDialog-container': {
            alignItems: 'flex-start',
          },
        }}
      >
        <SearchModal
          {...props}
          // initialQuery={initialQuery}
          onClose={onClose}
          // initialScrollY={window.scrollY}
          // translations={props?.translations?.modal}
        />
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* https://github.com/mui/material-ui/blob/master/docs/src/modules/components/AppSearch.js#L24 */}
      <GlobalStyles
        styles={(theme) => ({
          html: {
            ':root': {
              '--docsearch-primary-color': theme.palette.primary[500],
              '--docsearch-text-color': theme.palette.text.primary,
              '--docsearch-muted-color': theme.palette.grey[600],
              '--docsearch-searchbox-shadow': 0,
              '--docsearch-hit-shadow': 0,
              '--docsearch-footer-shadow': 0,
              '--docsearch-spacing': theme.spacing(1.5),
              '--docsearch-hit-active-color': theme.palette.primary[600],
              '--docsearch-logo-color': theme.palette.grey[600],
              '--docsearch-searchbox-focus-background': 'unset',
              '--docsearch-footer-background': 'unset',
              '--docsearch-modal-background': theme.palette.background.paper,
            },
          },
          body: {
            '.DocSearch-Container': {
              transition: `opacity ${FADE_DURATION}ms`,
              opacity: 0,
              zIndex: theme.zIndex.tooltip + 100,
              backgroundColor: alpha(theme.palette.grey[600], 0.2),
              backdropFilter: 'blur(4px)',
            },
            '& .DocSearch-StartScreen': {
              display: 'none',
            },
            '& .DocSearch-NewStartScreen': {
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: theme.spacing(2),
              padding: theme.spacing(2, 1),
            },
            '& .DocSearch-NewStartScreenCategory': {
              display: 'flex',
              flexDirection: 'column',
            },
            '& .DocSearch-NewStartScreenTitle': {
              display: 'flex',
              alignItems: 'center',
              padding: theme.spacing(1, 1),
              fontSize: theme.typography.pxToRem(14),
              color: theme.palette.text.secondary,
            },
            '& .DocSearch-NewStartScreenTitleIcon': {
              color: theme.palette.primary[500],
              marginRight: theme.spacing(1.5),
              fontSize: theme.typography.pxToRem(16),
            },
            '& .DocSearch-NewStartScreenItem': {
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              width: '100%',
              padding: theme.spacing(0.5, 4.6),
              color: theme.palette.primary[500],
              fontWeight: 500,
              fontSize: theme.typography.pxToRem(14),
              '&:hover, &:focus': {
                '.DocSearch-NewStartScreenItemIcon': {
                  marginLeft: theme.spacing(1),
                },
              },
            },
            '& .DocSearch-NewStartScreenItemIcon': {
              marginLeft: theme.spacing(0.5),
              transition: 'margin 0.2s',
              fontSize: theme.typography.pxToRem(16),
            },
            '& .DocSearch-Modal': {
              maxWidth: '700px',
              boxShadow: `0px 4px 20px ${alpha(theme.palette.grey[700], 0.2)}`,
              // docsearch.css: <= 750px will be full screen modal
              borderRadius: `clamp(0px, (100vw - 750px) * 9999, ${theme.shape.borderRadius}px)`,
            },
            '& .DocSearch-SearchBar': {
              // borderBottom: '1px solid',
              // borderColor: theme.palette.grey[200],
              padding: theme.spacing(1),
            },
            '& .DocSearch-Form': {
              '& .DocSearch-Reset': {
                display: 'none',
              },
              '& .DocSearch-Input': {
                paddingLeft: theme.spacing(2.5),
              },
              '& .DocSearch-Search-Icon': {
                width: '20px',
                height: '20px',
              },
            },
            '& .DocSearch-Cancel': {
              display: 'block',
              alignSelf: 'center',
              cursor: 'pointer',
              height: '1.5rem',
              marginRight: theme.spacing(1),
              padding: theme.spacing(0.3, 0.8, 0.6, 0.8),
              fontSize: 0,
              borderRadius: 5,
              backgroundColor: theme.palette.grey[50],
              border: '1px solid',
              borderColor: theme.palette.grey[300],
              '&::before': {
                content: '"esc"',
                fontSize: theme.typography.pxToRem(12),
                letterSpacing: '.08rem',
                fontWeight: 700,
                color: theme.palette.text.secondary,
              },
            },
            '& .DocSearch-Dropdown': {
              minHeight: 384, // = StartScreen height, to prevent layout shift when first char
              '&::-webkit-scrollbar-thumb': {
                borderColor: theme.palette.background.paper,
                backgroundColor: theme.palette.grey[500],
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.background.paper, 0.3),
              },
            },
            '& .DocSearch-Dropdown-Container': {
              '& .DocSearch-Hits:first-of-type': {
                '& .DocSearch-Hit-source': {
                  paddingTop: theme.spacing(1),
                },
              },
            },
            '& .DocSearch-Hit-source': {
              // top: 'initial',
              position: 'sticky',
              top: 0,
              lineHeight: '32px',
              paddingTop: theme.spacing(2),
              paddingX: 1,
              marginX: -1,
              background: theme.palette.background.paper,
              fontSize: theme.typography.pxToRem(13),
              fontWeight: 500,
              color: theme.palette.text.secondary,
            },
            '& .DocSearch-Hit': {
              paddingBottom: 0,
              '&:not(:first-of-type)': {
                marginTop: '-2px',
              },
            },
            '& .DocSearch-Hit a': {
              backgroundColor: 'transparent',
              padding: theme.spacing(0.25, 0),
              paddingLeft: theme.spacing(2),
              border: '1px solid transparent',
              borderBottomColor: theme.palette.grey[100],
            },
            '& .DocSearch-Hit-content-wrapper': {
              paddingLeft: theme.spacing(2),
            },
            '& .DocSearch-Hit-title': {
              fontSize: theme.typography.pxToRem(14),
              color: `${theme.palette.text.primary}`,
            },
            '& .DocSearch-Hit-path': {
              fontSize: theme.typography.pxToRem(12),
              color: `${theme.palette.text.secondary}`,
            },
            '& .DocSearch-Hit-Select-Icon': {
              height: '15px',
              width: '15px',
            },
            '& .DocSearch-Hit[aria-selected="true"] a': {
              backgroundColor: theme.palette.primary[50],
              borderColor: theme.palette.primary[500],
              borderRadius: theme.shape.borderRadius,
            },
            '& .DocSearch-Hit-action, & .DocSearch-Hits mark': {
              color: theme.palette.primary[500],
            },
            '& .DocSearch-Footer': {
              borderTop: '1px solid',
              borderColor: theme.palette.grey[200],
              '& .DocSearch-Commands': {
                display: 'none',
              },
            },
          },
        })}
      />
      <GlobalStyles
        styles={(theme) => [
          {
            // [theme.vars ? '[data-mui-color-scheme="dark"]:root' : '.mode-dark']: {
            'body[data-theme="dark"]': {
              '--docsearch-primary-color': theme.palette.primaryDark[300],
              '--docsearch-hit-active-color': theme.palette.primary[300],
              // '--docsearch-primary-color': theme.palette.primaryDark[300],
              // '--docsearch-hit-active-color': theme.palette.primary[300],
            },
          },
          {
            // [theme.vars ? '[data-mui-color-scheme="dark"] body' : '.mode-dark']: {
            '.DocSearch-Container': {
              backgroundColor: alpha(theme.palette.grey[900], 0.7),
            },
            '& .DocSearch-NewStartScreenTitleIcon': {
              color: theme.palette.primaryDark[300],
            },
            '& .DocSearch-NewStartScreenItem': {
              color: theme.palette.primaryDark[300],
            },
            '& .DocSearch-Modal': {
              boxShadow: `0px 4px 20px ${alpha(theme.palette.background.paper, 0.7)}`,
              border: '1px solid',
              borderColor: theme.palette.primaryDark[700],
            },
            '& .DocSearch-SearchBar': {
              borderColor: theme.palette.primaryDark[700],
            },
            '& .DocSearch-Cancel': {
              backgroundColor: theme.palette.primaryDark[800],
              borderColor: theme.palette.primaryDark[600],
            },
            '& .DocSearch-Dropdown': {
              '&::-webkit-scrollbar-thumb': {
                borderColor: theme.palette.primaryDark[900],
                backgroundColor: theme.palette.primaryDark[700],
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.background.paper, 0.3),
              },
            },
            '& .DocSearch-Hit a': {
              borderBottomColor: theme.palette.primaryDark[700],
            },
            '& .DocSearch-Hit[aria-selected="true"] a': {
              backgroundColor: theme.palette.primaryDark[800],
              borderColor: theme.palette.primaryDark[400],
            },
            '& .DocSearch-Hit-action, & .DocSearch-Hits mark': {
              color: theme.palette.primary[400],
            },
            '& .DocSearch-Footer': {
              borderColor: theme.palette.primaryDark[700],
            },
            // },
          },
        ]}
      />
    </>
  );
}

export function TempWrappedSearch() {
  // TODO: return loading state
  const apiKey = useAlgoliaSearchKey();

  if (!process.env.REACT_APP_ALGOLIA_APP_ID) {
    throw new Error('missing algolia appID in env variables');
  }

  if (!apiKey) return null;

  return (
    <>
      <Box sx={{ pb: 3 }}>
        <Typography variant='subtitle2' gutterBottom>
          Single index implementation
        </Typography>
        <Search
          appId={process.env.REACT_APP_ALGOLIA_APP_ID as string}
          // apiKey={process.env.REACT_APP_ALGOLIA_SEARCH_KEY as string}
          apiKey={apiKey}
          indexName='local_idemand_search'
          indexTitle='All Records'
          placeholder='Search...'
        />
      </Box>
      <div style={{ height: '500px', width: '100%' }}>
        <GeoSearch />
      </div>
    </>
  );
}
