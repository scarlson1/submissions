import { Container } from '@mui/material';

import { PageMeta } from 'components';
import { ClaimsGrid } from 'elements/grids';

export const Claims = () => {
  return (
    <>
      <PageMeta title='iDemand - Claims' />
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <ClaimsGrid />
      </Container>
    </>
  );
};
