import {
  GridViewRounded,
  MapRounded,
  TableRowsRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { QueryFieldFilterConstraint, where } from 'firebase/firestore';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Collection, VIEW_QUERY_KEY } from 'common';
import { ToggleViewLayout, ToggleViewLayoutProps, ToggleViewPanel } from 'components/toggleView';
import { QuoteCards } from 'elements';
import { QuotesGrid } from 'elements/grids';
import { QuotesMap } from 'elements/maps';
import { User } from 'firebase/auth';
import { DataViewType, TDataViewType, useClaims } from 'hooks';
import { ROUTES, createPath } from 'router';
import invariant from 'tiny-invariant';
import { Quotes as AdminQuotes, AdminQuotesActionMenu } from './admin/Quotes';

// TODO: UPDATE NON-ADMIN VIEW TO USE BREADCRUMBS

function getLayoutProps(claims: { iDemandAdmin: boolean; orgAdmin: boolean; agent: boolean }) {
  let props: Pick<ToggleViewLayoutProps<TDataViewType>, 'defaultOption' | 'actions'> = {
    defaultOption: 'cards',
  };
  if (claims?.iDemandAdmin) {
    props = {
      defaultOption: 'grid',
      actions: <AdminQuotesActionMenu />,
    };
  } else if (claims?.orgAdmin || claims?.agent) {
    props = {
      defaultOption: 'grid',
    };
  } else {
    props = {
      defaultOption: 'cards',
    };
  }
  return props;
}

function getQueryProps(
  user: User,
  claims: {
    iDemandAdmin: boolean;
    orgAdmin: boolean;
    agent: boolean;
  }
): { constraints: QueryFieldFilterConstraint[] } {
  let props: { constraints: QueryFieldFilterConstraint[] } = { constraints: [] };
  if (claims?.iDemandAdmin) {
    props = {
      constraints: [],
    };
  } else if (claims?.orgAdmin && user.tenantId) {
    props = {
      // TODO: uncomment once verifying org ID is set on all quotes
      // constraints: [where('agency.orgId', '==', `${user.tenantId}`)],
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else if (claims?.agent) {
    props = {
      constraints: [where('agent.userId', '==', `${user?.uid}`)],
    };
  } else {
    props = {
      constraints: [where('userId', '==', user.uid)],
    };
  }
  return props;
}

export const Quotes = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  invariant(user); // already wrapped in <RequireAuthReactFire />

  const layoutProps = useMemo(() => getLayoutProps(claims), [claims]);
  const queryProps = useMemo(() => getQueryProps(user, claims), [user, claims]);

  const handleViewQuote = useCallback(
    (quoteId: string) => {
      console.log('view quote: ', quoteId);
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

  return (
    <ToggleViewLayout<TDataViewType>
      title='Quotes'
      queryKey={VIEW_QUERY_KEY}
      options={DataViewType.options}
      icons={{
        cards: <GridViewRounded />,
        grid: <TableRowsRounded />,
        map: <MapRounded />,
      }}
      isFetchingOptions={{ queryKey: [`infinite-${Collection.Enum.policies}`] }}
      headerContainerSx={{ pb: { xs: 2, sm: 3, lg: 4 } }}
      {...layoutProps}
    >
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        <QuoteCards {...queryProps} onClick={handleViewQuote} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        {claims?.iDemandAdmin ? (
          <AdminQuotes />
        ) : (
          <QuotesGrid
            renderActions={renderActions}
            onRowDoubleClick={viewQuote}
            {...queryProps}
            checkboxSelection={claims?.iDemandAdmin}
          />
        )}
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.map}>
        <QuotesMap {...queryProps} />
      </ToggleViewPanel>
    </ToggleViewLayout>
  );

  // if (claims?.iDemandAdmin) {
  //   return (
  //     <DataViewLayout
  //       title='Quotes'
  //       isFetchingOptions={{ queryKey: [`infinite-${Collection.Enum.quotes}`] }}
  //       actions={<AdminQuotesActionMenu />}
  //     >
  //       {view === DataViewType.Enum.cards ? (
  //         <QuoteCards constraints={[]} onClick={handleViewQuote} />
  //       ) : null}
  //       {view === DataViewType.Enum.grid ? <AdminQuotes /> : null}
  //       {view === DataViewType.Enum.map ? <QuotesMap constraints={[]} /> : null}
  //     </DataViewLayout>
  //   );
  // }

  // if (claims?.agent || claims?.orgAdmin)
  //   return (
  //     <DataViewLayout
  //       title='Quotes'
  //       isFetchingOptions={{ queryKey: [`infinite-${Collection.Enum.quotes}`] }}
  //     >
  //       {view === DataViewType.Enum.cards ? (
  //         <QuoteCards
  //           constraints={[where('agent.userId', '==', `${user?.uid}`)]}
  //           onClick={handleViewQuote}
  //         />
  //       ) : null}
  //       {view === DataViewType.Enum.grid ? (
  //         <QuotesGrid
  //           constraints={[where('agent.userId', '==', `${user?.uid}`)]}
  //           renderActions={renderActions}
  //           onRowDoubleClick={viewQuote}
  //         />
  //       ) : null}
  //       {view === DataViewType.Enum.map ? (
  //         <QuotesMap constraints={[where('agent.userId', '==', `${user?.uid}`)]} />
  //       ) : null}
  //     </DataViewLayout>
  //   );

  // return (
  //   <DataViewLayout
  //     title='Quotes'
  //     isFetchingOptions={{ queryKey: [`infinite-${Collection.Enum.quotes}`] }}
  //   >
  //     {view === DataViewType.Enum.cards ? (
  //       <QuoteCards constraints={[where('userId', '==', user.uid)]} onClick={handleViewQuote} />
  //     ) : null}
  //     {view === DataViewType.Enum.grid ? (
  //       <QuotesGrid
  //         constraints={[where('userId', '==', user.uid)]}
  //         renderActions={renderActions}
  //         onRowDoubleClick={viewQuote}
  //       />
  //     ) : null}
  //     {view === DataViewType.Enum.map ? (
  //       <QuotesMap constraints={[where('userId', '==', user.uid)]} />
  //     ) : null}
  //   </DataViewLayout>
  // );
};
