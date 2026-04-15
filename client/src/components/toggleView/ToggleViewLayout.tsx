import { Box, Stack, SxProps, Typography } from '@mui/material';
import { QueryFilters, useIsFetching } from '@tanstack/react-query';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from 'components/ErrorFallback';
import { LoadingSpinner } from 'components/LoadingSpinner';
import ToggleButtonProvider from 'context/ToggleButtonContext';
import { useSearchParamToggle } from 'hooks';
import { ToggleViewButtons, ToggleViewButtonsProps } from './ToggleViewButtons';

// TODO: use slots (loading indicator, title, etc.) ??

export interface ToggleViewLayoutProps<
  T extends string,
> extends ToggleViewButtonsProps<T> {
  title?: string;
  children: ReactNode;
  isFetchingOptions?: QueryFilters;
  actions?: ReactNode;
  headerContainerSx?: SxProps;
}

export function ToggleViewLayout<T extends string>({
  title,
  children,
  isFetchingOptions,
  actions,
  queryKey,
  options,
  defaultOption,
  icons,
  headerContainerSx = {},
}: ToggleViewLayoutProps<T>) {
  const isFetching = useIsFetching(isFetchingOptions);
  const [view, handleViewChange] = useSearchParamToggle<T>(
    queryKey,
    options,
    defaultOption,
  );

  return (
    <ToggleButtonProvider value={view as string}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2, // { xs: 2, md: 3 },
          ...headerContainerSx,
        }}
      >
        {title ? (
          <Typography variant='h5' sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
            {title}
          </Typography>
        ) : null}
        <Stack
          direction='row'
          spacing={2}
          alignItems='center'
          sx={{ ml: 'auto' }}
        >
          <LoadingSpinner loading={isFetching > 0} size={18} />
          <ToggleViewButtons<T>
            queryKey={queryKey}
            options={options}
            defaultOption={defaultOption}
            onChange={handleViewChange}
            icons={icons}
          />
          {actions}
        </Stack>
      </Box>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[view]}>
        <Suspense fallback={<LoadingSpinner loading={true} />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </ToggleButtonProvider>
  );
}
