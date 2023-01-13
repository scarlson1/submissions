import React from 'react';
import { Box, Container, SxProps } from '@mui/material';
import { Outlet } from 'react-router-dom';

// import { Footer, HeaderDrawer, DrawerHeader } from 'components';
import { Header, Footer } from 'components';

export interface LayoutProps {
  noPadding?: boolean;
  mainSX?: SxProps;
  containerSX?: SxProps;
}

export const Layout: React.FC<LayoutProps> = ({ noPadding = false, mainSX, containerSX }) => {
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
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? '#FAFAFB' : 'background.paper',
          flexGrow: 1,
          ...mainSX,
        }}
      >
        <Header />
        <Container maxWidth='lg'>
          <Box
            sx={{
              pt: noPadding ? 0 : 6,
              px: noPadding ? 0 : 6,
              pb: noPadding ? 0 : 10,
              flex: '1 0 auto',
              display: 'flex',
              flexDirection: 'column',
              ...containerSX,
            }}
          >
            <Outlet />
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
