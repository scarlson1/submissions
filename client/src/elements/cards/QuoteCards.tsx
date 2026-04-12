import { LoadingButton } from '@mui/lab';
import { Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { orderBy, QueryFieldFilterConstraint } from 'firebase/firestore';
import { Fragment, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import { Quote } from 'common';
import { useInfiniteDocs } from 'hooks';
import { logDev } from 'modules/utils';
import { QuoteCard, QuoteCardProps } from './QuoteCard';

interface QuoteCardsProps extends Omit<QuoteCardProps, 'data'> {
  constraints: QueryFieldFilterConstraint[];
  // startingCursor?: DocumentReference;
  pageSize?: number;
}

export const QuoteCards = ({
  constraints,
  pageSize,
  ...props
}: QuoteCardsProps) => {
  const { ref, inView } = useInView();
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteDocs<Quote>('quotes', [
      ...constraints,
      orderBy('metadata.created', 'desc'),
    ]);

  useEffect(() => {
    if (!hasNextPage) return;
    if (inView) {
      logDev('fetchNextPage...');
      fetchNextPage();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage]);

  return (
    <>
      <Grid
        container
        rowSpacing={6}
        columnSpacing={8}
        // maxHeight={{ xs: 420, sm: 500, md: 800 }}
        // sx={{ overflowY: 'auto' }}
      >
        {data?.pages.map((group, i) => (
          <Fragment key={`quote-card-group-${i}`}>
            {group.data.map((q) => (
              <Grid xs={12} sm={6} md={4} xl={3} key={q.id}>
                <QuoteCard data={q} {...props} />
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
