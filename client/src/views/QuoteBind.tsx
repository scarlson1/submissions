import { Box, Typography } from '@mui/material';

import BindQuoteForm from 'elements/forms/BindQuote';
import { PageMeta } from 'router';

export const QuoteBind = () => {
  return (
    <Box>
      <PageMeta title='iDemand - Bind Quote' />
      <Typography variant='h5' sx={{ pl: 4 }} align='center'>
        Bind Quote
      </Typography>
      <BindQuoteForm />
    </Box>
  );
};
