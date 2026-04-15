import { Container, Typography } from '@mui/material';

import { PageMeta } from 'components';
import { ReceivablesPolicyGrid } from 'elements/grids';

export const Billing = () => {
  return (
    <>
      <PageMeta title='iDemand - Billing' />
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant='h5' gutterBottom>
          Billing
        </Typography>
        <ReceivablesPolicyGrid />
      </Container>
    </>
  );
};
