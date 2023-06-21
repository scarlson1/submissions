import React, { Suspense } from 'react';
import { Box, Container, ContainerProps, SxProps } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { Header, Footer, Breadcrumbs, LoadingSpinner } from 'components';
// import { useConcurrentLocation } from 'hooks';
// import ProgressBar from './ProgressBar';

export const LoadingComponent = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5, lg: 8 } }}>
      <LoadingSpinner loading={true} />
    </Box>
  );
};

export interface LayoutProps {
  noPadding?: boolean;
  mainSX?: SxProps;
  bodyWrapperSX?: SxProps;
  containerProps?: ContainerProps;
  withBreadcrumbs?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  noPadding = false,
  mainSX,
  bodyWrapperSX,
  containerProps,
  withBreadcrumbs = false,
}) => {
  // const { isPending } = useConcurrentLocation();

  // console.log('isPending: ', isPending);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Box
        component='main'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          maxWidth: '100vw',
          backgroundColor: (theme) => theme.palette.background.default,
          // theme.palette.mode === 'light' ? '#FAFAFB' : 'background.paper',
          flexGrow: 1,
          ...mainSX,
        }}
      >
        {/* <ProgressBar isAnimating={true} /> */}
        <Header />
        <Container {...containerProps}>
          <Box
            sx={{
              pt: noPadding ? 0 : { xs: 2, sm: 3, md: 4, lg: 6 },
              px: noPadding ? 0 : { xs: 2, sm: 3, md: 4, lg: 6 },
              pb: noPadding ? 0 : { xs: 5, sm: 6, md: 8, lg: 10 },
              flex: '1 0 auto',
              display: 'flex',
              flexDirection: 'column',
              ...bodyWrapperSX,
            }}
          >
            {!!withBreadcrumbs && <Breadcrumbs sx={{ pb: 1 }} />}
            <Suspense fallback={<LoadingComponent />}>
              <Outlet />
            </Suspense>
          </Box>
        </Container>
        <Footer />
      </Box>
    </Box>
  );
};

// export default Layout;

// {state && state.backgroundLocation && (
//   <Routes>
//     <Route
//       path='quotes/:quoteId/rating/:ratingId'
//       element={<ShowRatingDataDialog />}
//       loader={ratingLoader(queryClient)}
//       errorElement={<ErrorEl />}
//     />
//   </Routes>
// )}
