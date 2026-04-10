import { Box, Unstable_Grid2 as Grid } from '@mui/material';
import algoliasearch from 'algoliasearch/lite';
import {
  Hits,
  Index,
  InstantSearch,
  Pagination,
  SearchBox,
  type InstantSearchProps,
} from 'react-instantsearch';
// import { SearchModal } from './SearchModal';

// import { Autocomplete } from './AlgoliaAutocompleteExample';
// DOC SEARCH modal component: https://github.com/algolia/docsearch/blob/main/packages/docsearch-react/src/DocSearchModal.tsx

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID as string,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string,
);

export const SearchOld = () => {
  // const appId = import.meta.env.VITE_ALGOLIA_APP_ID as string;
  // const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          py: 8,
          px: 4,
          width: '100%',
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <InstantSearch
          searchClient={searchClient as InstantSearchProps['searchClient']}
          indexName='local_users'
          routing
        >
          <Grid container spacing={6}>
            <Grid xs={12}>
              <SearchBox style={{ width: '300px' }} />
              {/* <Autocomplete
              searchClient={searchClient}
              placeholder='Search users, tasks'
              detachedMediaQuery='none'
              openOnFocus
            /> */}
            </Grid>
            <Grid xs={12}>
              <Index indexName='local_tasks'>
                {/* <Configure hitsPerPage={2} /> */}
                <Hits hitComponent={Hit} />
              </Index>
            </Grid>
            <Grid xs={12}>
              <Index indexName='local_users'>
                {/* <Configure hitsPerPage={2} /> */}
                <Hits hitComponent={UserHits} />
                <Pagination />
              </Index>
            </Grid>
          </Grid>
        </InstantSearch>
      </Box>

      {/* <Divider sx={{ my: 4 }} />
      <Box sx={{ flex: '1 0 auto', minWidth: '100%' }}>
        <SearchModal appId={appId} apiKey={searchKey} indexName='local_tasks' />
      </Box> */}
    </Box>
  );
};

function Hit({ hit }: Record<string, any>) {
  return (
    <article>
      {/* <img src={hit.image} alt={hit.name} /> */}
      <h4>{hit.title}</h4>
      <p>{hit.content}</p>
    </article>
  );
}

function UserHits({ hit }: Record<string, any>) {
  return (
    <article>
      <h4>{`${hit.firstname} ${hit.lastname}`}</h4>
      <p>{hit.uid}</p>
    </article>
  );
}
