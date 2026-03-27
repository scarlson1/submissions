import { Box, Typography } from '@mui/material';

import { PageMeta } from 'components';
import BindQuoteForm from 'elements/forms/BindQuote';

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
