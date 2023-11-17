import { VisibilityRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { COLLECTIONS, VIEW_QUERY_KEY } from 'common';
import { DataViewLayout } from 'components/layout';
import { QuoteCards } from 'elements';
import { QuotesGrid } from 'elements/grids';
import { QuotesMap } from 'elements/maps';
import { DataViewType, useClaims } from 'hooks';
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
        actions={<AdminQuotesActionMenu />}
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
};
