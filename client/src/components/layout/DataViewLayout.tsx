import { GridViewRounded, MapRounded, TableRowsRounded } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { QueryFilters, useIsFetching } from '@tanstack/react-query';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSearchParams } from 'react-router-dom';

import { VIEW_QUERY_KEY } from 'common';
import { ErrorFallback } from 'components/ErrorFallback';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ViewToggleButtons } from 'components/ViewToggleButtons';
import { DataViewType, TDataViewType } from 'hooks';

export function DataViewLayout({
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
            icons={{
              cards: <GridViewRounded />,
              grid: <TableRowsRounded />,
              map: <MapRounded />,
            }}
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
