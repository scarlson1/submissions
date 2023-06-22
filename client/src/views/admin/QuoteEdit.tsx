import React from 'react';
import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export const QuoteEdit = () => {
  const params = useParams();

  return (
    <Typography variant='h5' color='warning.main' align='center' sx={{ py: 5 }}>
      {`TODO: QuoteEdit Component (ID: ${params.quoteId})`}
    </Typography>
  );
};
