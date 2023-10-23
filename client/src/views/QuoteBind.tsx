import { Box, Typography } from '@mui/material';

import BindQuoteForm from 'elements/forms/BindQuote';

export const QuoteBind = () => {
  return (
    <Box>
      <Typography variant='h5' sx={{ pl: 4 }} align='center'>
        Bind Quote
      </Typography>
      <BindQuoteForm />
    </Box>
  );
};
