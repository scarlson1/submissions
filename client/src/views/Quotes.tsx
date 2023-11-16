import {
  GridViewRounded,
  MapRounded,
  TableRowsRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { ReactNode, Suspense, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { QueryFilters, useIsFetching } from '@tanstack/react-query';
import { COLLECTIONS } from 'common';
import { ErrorFallback, LoadingSpinner, ViewToggleButtons } from 'components';
import { QuoteCards } from 'elements';
import { QuotesGrid } from 'elements/grids';
import { QuotesMap } from 'elements/maps';
import { DataViewType, TDataViewType, useClaims } from 'hooks';
import { ErrorBoundary } from 'react-error-boundary';
import { ROUTES, createPath } from 'router';
import { Quotes as AdminQuotes, AdminQuotesActionMenu } from './admin/Quotes';

// TODO: UPDATE NON-ADMIN VIEW TO USE BREADCRUMBS

export const Quotes = () => {
  const { claims, user } = useClaims();
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';
  if (!user) throw new Error('must be signed in'); // already wrapped in <RequireAuthReactFire />

  const handleViewQuote = useCallback(
    (quoteId: string) => {
      navigate(
        createPath({
          path: ROUTES.QUOTE_VIEW,
          params: { quoteId },
        })
      );
    },
    [navigate]
  );

  const viewQuote = useCallback(
    (params: GridRowParams) => () => handleViewQuote(params.id.toString()),
    [handleViewQuote]
  );

  const renderActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip placement='top' title='view quote'>
            <VisibilityRounded />
          </Tooltip>
        }
        onClick={viewQuote(params)}
        label='Details'
      />,
    ],
    [viewQuote]
  );

  if (claims?.iDemandAdmin) {
    return (
      <DataViewLayout
        title='Quotes'
        isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.QUOTES}`] }}
        actions={
          <>
            {/* <Button
              onClick={() =>
                navigate(
                  createPath({ path: ADMIN_ROUTES.QUOTE_NEW_BLANK, params: { productId: 'flood' } })
                )
              }
              sx={{ maxHeight: 36 }}
            >
              New Quote
            </Button> */}
            <AdminQuotesActionMenu />
          </>
        }
      >
        {view === DataViewType.Enum.cards ? (
          <QuoteCards constraints={[]} onClick={handleViewQuote} />
        ) : null}
        {view === DataViewType.Enum.grid ? <AdminQuotes /> : null}
        {view === DataViewType.Enum.map ? <QuotesMap constraints={[]} /> : null}
      </DataViewLayout>
    );
  }

  if (claims?.agent || claims?.orgAdmin)
    return (
      <DataViewLayout
        title='Quotes'
        isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.QUOTES}`] }}
      >
        {view === DataViewType.Enum.cards ? (
          <QuoteCards
            constraints={[where('agent.userId', '==', `${user?.uid}`)]}
            onClick={handleViewQuote}
          />
        ) : null}
        {view === DataViewType.Enum.grid ? (
          <QuotesGrid
            constraints={[where('agent.userId', '==', `${user?.uid}`)]}
            renderActions={renderActions}
            onRowDoubleClick={viewQuote}
          />
        ) : null}
        {view === DataViewType.Enum.map ? (
          <QuotesMap constraints={[where('agent.userId', '==', `${user?.uid}`)]} />
        ) : null}
      </DataViewLayout>
      // <Box>
      //   <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      //     <Typography variant='h5' gutterBottom sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
      //       Quotes
      //     </Typography>
      //   </Box>
      //   <QuotesGrid
      //     constraints={[where('agent.userId', '==', `${user?.uid}`)]}
      //     renderActions={renderActions}
      //     onRowDoubleClick={viewQuote}
      //   />
      // </Box>
    );

  return (
    <DataViewLayout
      title='Quotes'
      isFetchingOptions={{ queryKey: [`infinite-${COLLECTIONS.QUOTES}`] }}
    >
      {view === DataViewType.Enum.cards ? (
        <QuoteCards constraints={[where('userId', '==', user.uid)]} onClick={handleViewQuote} />
      ) : null}
      {view === DataViewType.Enum.grid ? (
        <QuotesGrid
          constraints={[where('userId', '==', user.uid)]}
          renderActions={renderActions}
          onRowDoubleClick={viewQuote}
        />
      ) : null}
      {view === DataViewType.Enum.map ? (
        <QuotesMap constraints={[where('userId', '==', user.uid)]} />
      ) : null}
    </DataViewLayout>
  );

  // return (
  //   <Box>
  //     <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
  //       <Typography variant='h5' gutterBottom sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
  //         Quotes
  //       </Typography>
  //     </Box>
  //     <QuotesGrid
  //       constraints={[where('userId', '==', user.uid)]}
  //       renderActions={renderActions}
  //       onRowDoubleClick={viewQuote}
  //     />
  //   </Box>
  // );
};

const VIEW_QUERY_KEY = 'view';

function DataViewLayout({
  title,
  children,
  isFetchingOptions,
  actions,
}: {
  title: string;
  children: ReactNode;
  isFetchingOptions?: QueryFilters;
  actions?: ReactNode;
}) {
  const isFetching = useIsFetching(isFetchingOptions);
  // TODO: remove useSearchParams and retrieve from context once refactored
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: { xs: 2, md: 3 },
        }}
      >
        <Typography variant='h5' sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
          {title}
        </Typography>
        <Stack direction='row' spacing={2} alignItems='center'>
          <LoadingSpinner loading={isFetching > 0} />
          <ViewToggleButtons<TDataViewType>
            queryKey={VIEW_QUERY_KEY}
            options={DataViewType.options}
            defaultOption='cards'
            // defaultOption={claims.agent || claims.orgAdmin || claims.iDemandAdmin ? 'grid' :'cards'}
            icons={{ cards: <GridViewRounded />, grid: <TableRowsRounded />, map: <MapRounded /> }}
          />
          {actions}
        </Stack>
      </Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>{children}</Suspense>
      </ErrorBoundary>
    </Box>
  );
}
