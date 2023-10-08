import { LoadingButton } from '@mui/lab';
import { Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { DocumentReference, where } from 'firebase/firestore';
import { Fragment, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import { COLLECTIONS, ILocation, Policy } from 'common';
import { useDocData, useInfiniteDocs } from 'hooks';
import { LocationCard, LocationCardProps } from './LocationCard';

// TODO: virtualize ?? need to with 100 + locations
// tanstack virtual: https://tanstack.com/virtual/v3/docs/examples/react/infinite-scroll
// TODO: animate entrance (fade ??)
// TODO: add sort / filter capabilities
// passed as props so same filters can be shared across cards/map ??

interface PolicyLocationCardsProps extends Omit<LocationCardProps, 'location' | 'namedInsured'> {
  policyId: string;
  startingCursor?: DocumentReference;
  pageSize?: number;
}

export const PolicyLocationCards = ({ policyId, ...props }: PolicyLocationCardsProps) => {
  const { ref, inView } = useInView();
  const { data: policy } = useDocData<Policy>('POLICIES', policyId);
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteDocs<ILocation>(COLLECTIONS.LOCATIONS, [
      where('policyId', '==', policyId),
      where('parentType', '==', 'policy'),
    ]);
  // limited to 50 IDs:
  // where(documentId(), 'in', Object.keys(policy.locations)),

  useEffect(() => {
    if (!hasNextPage) return;
    if (inView) {
      console.log('fetchNextPage...');
      fetchNextPage();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage]);

  return (
    <>
      <Grid
        container
        rowSpacing={6}
        columnSpacing={8}
        maxHeight={{ xs: 400, sm: 500, md: 800 }}
        sx={{ overflowY: 'auto', pt: 3 }}
      >
        {data?.pages.map((group, i) => (
          <Fragment key={i}>
            {group.data.map((l) => (
              <Grid xs={12} sm={6} md={4} xl={3} key={l.id}>
                <LocationCard location={l} namedInsured={policy.namedInsured} {...props} />
              </Grid>
            ))}
          </Fragment>
        ))}
        <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <LoadingButton
            ref={ref}
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            loading={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? 'Loading more...'
              : hasNextPage
              ? 'Load more'
              : 'All items loaded'}
          </LoadingButton>
        </Grid>
      </Grid>

      {Boolean(error) && (
        <>
          <Typography gutterBottom>Something went wrong</Typography>
          <Typography component='div' variant='body2' color='text.secondary'>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </Typography>
        </>
      )}
    </>
  );
};
