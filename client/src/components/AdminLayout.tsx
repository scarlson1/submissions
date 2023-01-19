import React, { useMemo } from 'react';
import { Box, Container, SxProps } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { Header, Footer } from 'components';
import { ADMIN_ROUTES, ROUTES, createPath } from 'router';

export interface AdminLayoutProps {
  noPadding?: boolean;
  mainSX?: SxProps;
  containerSX?: SxProps;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  noPadding = false,
  mainSX,
  containerSX,
}) => {
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
