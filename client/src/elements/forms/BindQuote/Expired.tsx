import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES, createPath } from 'router';

import { TimeManagementSVG } from 'assets/images';
import { TProduct } from 'common';
import { formatDate } from 'modules/utils';

interface QuoteExpiredProps {
  productId: TProduct;
  expiredDate: Date;
}
// TODO: use component or just disable old quote button and put "expired" stamp on it ? prompt to create a new quote

export function QuoteExpired({ productId, expiredDate }: QuoteExpiredProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 5 }}>
      <Typography variant='h5' align='center' gutterBottom>
        Quote Expired
      </Typography>
      <Typography variant='subtitle2' color='text.secondary' align='center' gutterBottom>
        {formatDate(expiredDate)}
      </Typography>
      <Box sx={{ py: 5, height: { xs: 60, sm: 80, md: 100 }, width: '100%' }}>
        <TimeManagementSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={() =>
            navigate(createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId } }))
          }
          variant='contained'
        >
          Start a new Quote
        </Button>
      </Box>
    </Box>
  );
}
