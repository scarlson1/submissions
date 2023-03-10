import React from 'react';
import { Box, Typography } from '@mui/material';

// loader - use search or params to optionally prefilter by product ?
// can use useEffect + subscription to automatically update query when filter changes (like react query)

// case QUOTE_STATUS.PROCESSING_PAYMENT:
//       return { icon: <PaymentsRounded />, color: 'info' };
// case QUOTE_STATUS.AWAITING_PAYMENT:
//   return { icon: <CreditCardOffRounded />, color: 'info' };
// case QUOTE_STATUS.PAID:
//   return { icon: <CreditScoreRounded />, color: 'success' };

export const Policies: React.FC = () => {
  return (
    <Box>
      <Typography variant='h5' gutterBottom>
        Policies
      </Typography>
      <Typography variant='subtitle2' color='warning.main'>
        TODO: policies grid
      </Typography>
    </Box>
  );
};
