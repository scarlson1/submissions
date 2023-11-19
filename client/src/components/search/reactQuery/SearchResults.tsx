import { Hit, SearchOptions } from '@algolia/client-search';
import {
  AccountCircleRounded,
  ArticleRounded,
  MoveToInboxRounded,
  RequestQuoteRounded,
  TextSnippetRounded,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import { Collection } from 'common';
import { useAlgolia } from 'hooks/useAlgolia';
import { Fragment } from 'react';

// TODO: hit component w/ collectionName icon
// render results in dropdown
// onSelect/onClick handler

export type BaseHit = {
  searchTitle: string;
  searchSubtitle: string;
} & Record<string, any>;

type SearchResultsProps = SearchOptions & { onSelect: (item: Hit<BaseHit>) => void };

// TODO: onSelect handler

export function SearchResults({ query = '', onSelect, ...props }: SearchResultsProps) {
  const { hits, isLoading, isFetching, status, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAlgolia<BaseHit>({
      // TODO: hit type
      // Product
      // indexName: 'best_buy',
      indexName: import.meta.env.VITE_ALGOLIA_INDEX_NAME as string,
      query,
      hitsPerPage: 5,
      staleTime: 1000 * 60, // 60s
      gcTime: 1000 * 60 * 15, // 15m
      enabled: !!query,
      ...props,
    });

  if (!query) return null;

  if (isLoading) return <div className='loading'>Loading...</div>;

  return (
    <div>
      <div className='search-status'>
        Status: {status} {isFetching && <span>fetching...</span>}
      </div>
      <List dense disablePadding sx={{ width: '100%', maxWidth: 360 }}>
        {hits && hits.length > 0 ? (
          hits.map((hit) => (
            <Fragment key={hit.objectID}>
              <ListItem dense alignItems='flex-start'>
                <ListItemButton onClick={() => onSelect(hit)}>
                  <ListItemIcon>{getCollectionIcon(hit.collectionName)}</ListItemIcon>
                  <ListItemText primary={hit.searchTitle} secondary={hit.searchSubtitle} />
                </ListItemButton>
              </ListItem>
              <Divider component='li' />
            </Fragment>
          ))
        ) : (
          <Typography variant='h6' color='text.secondary'>
            No matched found
          </Typography>
        )}
      </List>
      <div>
        {/* <div className='search-result'>
          {hits && hits.length > 0 ? (
            hits.map((hit) => (
              <li key={hit.objectID} className='product'>
                <span className='product-name'>{`[${hit.collectionName}] - ${hit.searchTitle}`}</span>
                {hit.searchSubtitle && (
                  <>
                    <br />
                    <span className='product-description'>{hit.searchSubtitle}</span>
                  </>
                )}
                <br />
                {hit.salePrice ? <span className='product-price'>${hit.salePrice}</span> : null }
              </li>
            ))
          ) : (
            <h3>No matches found!</h3>
          )}
        </div> */}
        {hasNextPage ? (
          <LoadingButton
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            sx={{ my: 2 }}
          >
            more
          </LoadingButton>
        ) : null}
        {/* {hasNextPage && <Button onClick={() => fetchNextPage()}>more</Button>}
        {isFetchingNextPage && (
          <Typography variant='body2' color='text.secondary'>
            Fetching next page...
          </Typography>
        )} */}
      </div>
    </div>
  );
}

function getCollectionIcon(col?: string) {
  switch (col) {
    case Collection.Enum.users:
      return <AccountCircleRounded />;
    case Collection.Enum.policies:
      return <ArticleRounded />;
    case Collection.Enum.quotes:
      return <RequestQuoteRounded />;
    case Collection.Enum.submissions:
      return <MoveToInboxRounded />;
    default:
      return <TextSnippetRounded />;
  }
}
