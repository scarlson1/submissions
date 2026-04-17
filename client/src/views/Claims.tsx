import { Collection } from '@idemand/common';
import { GridViewRounded, TableRowsRounded } from '@mui/icons-material';
import { alpha, type Theme } from '@mui/material';
import { VIEW_QUERY_KEY } from 'common';

import {
  ToggleViewLayout,
  ToggleViewPanel,
  type ToggleViewLayoutProps,
} from 'components/toggleView';
import { PolicyClaimCards } from 'elements/cards';
import { ClaimsGrid } from 'elements/grids';
import { DataViewType, useClaims } from 'hooks';
import { getClaimsQueryProps } from 'modules/db/query';
import { useMemo } from 'react';
import invariant from 'tiny-invariant';
import type z from 'zod';

// type ClaimsDataViewType = Omit<TDataViewType, 'map'>
const ClaimsDataViewType = DataViewType.exclude(['map']);

type TClaimsDataViewType = z.infer<typeof ClaimsDataViewType>;

function getLayoutProps(claims: {
  iDemandAdmin: boolean;
  orgAdmin: boolean;
  agent: boolean;
}) {
  let props: Pick<
    ToggleViewLayoutProps<TClaimsDataViewType>,
    'defaultOption' | 'actions'
  > = {
    defaultOption: 'cards',
  };
  if (claims?.iDemandAdmin) {
    props = {
      defaultOption: 'grid',
      // actions: <AdminQuotesActionMenu />,
    };
  } else if (claims?.orgAdmin || claims?.agent) {
    props = {
      defaultOption: 'grid',
    };
  }
  return props;
}

export const Claims = () => {
  const { user, claims } = useClaims();
  invariant(user, 'authentication required');

  const layoutProps = useMemo(() => getLayoutProps(claims), [claims]);
  const queryProps = useMemo(
    () => getClaimsQueryProps(user, claims),
    [user, claims],
  );

  return (
    <ToggleViewLayout<TClaimsDataViewType>
      title='Claims'
      queryKey={VIEW_QUERY_KEY}
      options={ClaimsDataViewType.options}
      icons={{
        cards: <GridViewRounded />,
        grid: <TableRowsRounded />,
        // map: <MapRounded />,
      }}
      isFetchingOptions={{ queryKey: [`infinite-${Collection.Enum.claims}`] }}
      headerContainerSx={{
        pb: { xs: 2, sm: 3, lg: 4 },
        position: 'sticky',
        top: 10,
        zIndex: 1,
        pt: { xs: 2, sm: 3 },
        // bgcolor: 'background.default',
        backgroundColor: (theme) =>
          alpha((theme as Theme).palette.background.default, 0.75),
        borderRadius: 1,
        backdropFilter: 'blur(10px)',
      }}
      {...layoutProps}
    >
      <ToggleViewPanel value={DataViewType.Enum.cards}>
        {/* <QuoteCards {...queryProps} onClick={handleViewQuote} /> */}
        <PolicyClaimCards constraints={queryProps.constraints} />
      </ToggleViewPanel>
      <ToggleViewPanel value={DataViewType.Enum.grid}>
        <ClaimsGrid />
        {/* {claims?.iDemandAdmin ? (
          <AdminQuotes />
        ) : (
          <QuotesGrid
            renderActions={renderActions}
            onRowDoubleClick={viewQuote}
            {...queryProps}
            checkboxSelection={claims?.iDemandAdmin}
          />
        )} */}
      </ToggleViewPanel>
    </ToggleViewLayout>
  );
  // return (
  //   <>
  //     <PageMeta title='iDemand - Claims' />
  //     <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
  //       <ClaimsGrid />
  //     </Container>
  //   </>
  // );
};
