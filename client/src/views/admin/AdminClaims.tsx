import { Box, Container, Typography } from '@mui/material';

import { PageMeta } from 'components';
import { ClaimsGrid } from 'elements/grids';

export const AdminClaims = () => {
  return (
    <>
      <PageMeta title='iDemand - Claims' />
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant='h6' gutterBottom>
          Claims
        </Typography>
        <Box sx={{ mt: 2 }}>
          <ClaimsGrid />
        </Box>
      </Container>
    </>
  );
};
