import React from 'react';
import { Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';

import { FormikTextField } from 'components/forms';
// import { useWidth } from 'hooks/use-width';

export const FormikCardDetails: React.FC = () => {
  // const isMobile = useWidth();

  return (
    <Grid2 container spacing={2} xs={12} sx={{ mt: 2 }}>
      <Grid2 xs={12} sm={6}>
        <FormikTextField
          name='accountHolder'
          label='Name on Card'
          fullWidth
          required
          // size={isMobile ? 'small' : 'medium'}
        />
      </Grid2>
      <Grid2 xs={12} sm={6}>
        <FormikTextField
          name='cardNumber'
          label='Card Number'
          fullWidth
          required
          // size={isMobile ? 'small' : 'medium'}
        />
      </Grid2>
      <Grid2 xs={6}>
        {/* TODO: use date field */}
        <FormikTextField name='cardExpDate' label='Exp Date' fullWidth required />
      </Grid2>
      <Grid2 xs={6}>
        <FormikTextField name='cvc' label='CVC' fullWidth required />
      </Grid2>
      <Grid2 xs={6}>
        <FormikTextField name='postalCode' label='Postal Code' fullWidth required />
      </Grid2>
      <Grid2 xs={12}>
        <Typography variant='body2' sx={{ py: 3, color: 'text.secondary' }}>
          * 3.5% fee is added to cover the processing cost for card transactions.
        </Typography>
      </Grid2>
    </Grid2>
  );
};

export default FormikCardDetails;
