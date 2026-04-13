import { LoadingButton } from '@mui/lab';
import { Box, Button, Typography } from '@mui/material';
import { Unstable_Grid2 as Grid } from '@mui/material/';
import { orderBy, QueryFieldFilterConstraint } from 'firebase/firestore';
import { Fragment, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

import type { Submission } from '@idemand/common';
import { VoidSVG } from 'assets/images';
import { useInfiniteDocs } from 'hooks';
import { createPath, ROUTES } from 'router';
import { SubmissionCard } from './SubmissionCard';

const useUserSubmissions = (constraints: QueryFieldFilterConstraint[] = []) => {
  const { ref, inView } = useInView();
  const {
    data,
    error,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteDocs<Submission>('submissions', [
    ...constraints,
    orderBy('metadata.created', 'desc'),
  ]);

  useEffect(() => {
    if (!hasNextPage) return;
    if (inView) {
      console.log('fetchNextPage...');
      fetchNextPage();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage]);

  return useMemo(
    () => ({
      data,
      error,
      isFetchingNextPage,
      hasNextPage,
      status,
      fetchNextPage,
      loadMoreRef: ref,
    }),
    [data, error, isFetchingNextPage, hasNextPage, status, fetchNextPage, ref],
  );
};

interface SubmissionCardsProps {
  constraints: QueryFieldFilterConstraint[];
  onClick?: () => void;
}

export const SubmissionCards = ({ constraints }: SubmissionCardsProps) => {
  const navigate = useNavigate();
  const {
    data,
    status,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    loadMoreRef,
  } = useUserSubmissions(constraints);

  // useEffect(() => {
  //   logDev('DATA: ', data);
  // }, [data]);

  if (status === 'pending')
    return <Typography align='center'>Loading...</Typography>;

  // TODO: use react query hook for fetching status (uses context --> can display in parent)
  return (
    <Box>
      {data && data?.pages?.length > 0 ? (
        <>
          <Grid container rowSpacing={6} columnSpacing={8}>
            {data?.pages.map((group, i) => (
              <Fragment key={`submission-group-${i}`}>
                {group.data.map((s) => (
                  <Grid xs={12} sm={6} md={4} lg={4} xl={3} key={s.id}>
                    <SubmissionCard submission={s} />
                  </Grid>
                ))}
              </Fragment>
            ))}
            <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <LoadingButton
                ref={loadMoreRef}
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
        </>
      ) : (
        <Box>
          <Box sx={{ height: { xs: 60, sm: 80, md: 100 }, width: '100%' }}>
            <VoidSVG
              height='100%'
              width='100%'
              preserveAspectRatio='xMidYMin meet'
            />
          </Box>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            align='center'
            sx={{ py: 2 }}
          >
            No Submissions
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Button
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                )
              }
            >
              Start a quote
            </Button>
          </Box>
        </Box>
      )}

      {Boolean(error) && (
        <>
          <Typography gutterBottom>Something went wrong</Typography>
          <Typography component='div' variant='body2' color='text.secondary'>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </Typography>
        </>
      )}
    </Box>
  );
};
